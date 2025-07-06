import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Throttle a callback to a certain delay, It will only call the callback if the delay has passed, with the arguments
 * from the last call
 */
// debounce
const useThrottleCallback = <Params extends unknown[], Return>(
  callback: (...args: Params) => Return,
  delay: number
) => {
  const lastCall = useRef(0);
  const timeout = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Params) => {
      const now = Date.now();
      const remainingTime = delay - (now - lastCall.current);

      if (remainingTime <= 0) {
        if (timeout.current) {
          clearTimeout(timeout.current);
          timeout.current = null;
        }
        lastCall.current = now;
        callback(...args);
      } else if (!timeout.current) {
        timeout.current = setTimeout(() => {
          lastCall.current = Date.now();
          timeout.current = null;
          callback(...args);
        }, remainingTime);
      }
    },
    [callback, delay]
  );
};

const supabase = createClient();

const generateRandomColor = () =>
  `hsl(${Math.floor(Math.random() * 360)}, 100%, 70%)`;

export const generateRandomNumber = () => Math.floor(Math.random() * 100);

const EVENT_NAME = "realtime-player-move";

interface Player {
  position: {
    x: number;
    y: number;
  };
  user: {
    id: string;
    name: string;
  };
  animation?: string;
  color?: string;
}

interface PlayerEventPayload extends Player {
  timestamp: number;
}

export const useRealtimePlayers = ({
  roomName,
  username,
  userId,
  throttleMs,
}: {
  roomName: string;
  userId: string;
  username: string;
  throttleMs: number;
}) => {
  const [color] = useState(generateRandomColor());
  const [players, setPlayers] = useState<Record<string, PlayerEventPayload>>(
    {}
  );

  const channelRef = useRef<RealtimeChannel | null>(null);
  const removedPlayers = useRef<Record<string, PlayerEventPayload>>({});

  const callback = useCallback(
    (event: Player) => {
      const { position, user, color: userColor, animation } = event;

      console.log({ event });

      const payload: PlayerEventPayload = {
        position: {
          x: position.x,
          y: position.y,
        },
        user: {
          id: user.id || userId,
          name: user.name || username,
        },
        color: userColor || color,
        animation: animation,
        timestamp: new Date().getTime(),
      };

      channelRef.current?.send({
        type: "broadcast",
        event: EVENT_NAME,
        payload: payload,
      });
    },
    [userId, username, color]
  );

  const handlePlayerMove = useThrottleCallback(callback, throttleMs);

  useEffect(() => {
    const channel = supabase.channel(roomName); // macrodata_refinement_office
    channelRef.current = channel;

    channel
      .on(
        "broadcast",
        { event: EVENT_NAME },
        (data: { payload: PlayerEventPayload }) => {
          const { user } = data.payload;
          // Don't render your own cursor
          if (user.id === userId) return;

          setPlayers((prev) => {
            if (prev[userId]) {
              delete prev[userId];
            }

            if (removedPlayers.current[user.id]) {
              delete removedPlayers.current[user.id];
            }

            return {
              ...prev,
              [user.id]: data.payload,
            };
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe().then((receivedMsg) => {
        if (receivedMsg === "ok") {
          removedPlayers.current = {
            ...removedPlayers.current,
            ...Object.fromEntries(
              Object.entries(players).filter(([id]) => id !== userId)
            ),
          };
        }
      });
    };
  }, []);

  return { players, handlePlayerMove };
};
