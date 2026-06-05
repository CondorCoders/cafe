"use client";

import { useOnlineUsers } from "@/context/online-users-context";
import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef } from "react";

const supabase = createClient();

const EVENT_NAME = "realtime-player-move";
const DEFAULT_ANIMATION = "idle-down";
const DEFAULT_AVATAR = "sofia";
const PRESENCE_UPDATE_INTERVAL_MS = 2000;
const PRESENCE_POSITION_DELTA = 24;
const PRESENCE_HEARTBEAT_MS = 3000;

export const DEFAULT_PLAYER_SPAWN = {
  x: 960,
  y: 994,
};

const useThrottleCallback = <Params extends unknown[], Return>(
  callback: (...args: Params) => Return,
  delay: number
) => {
  const callbackRef = useRef(callback);
  const lastCall = useRef(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingArgs = useRef<Params | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(
    () => () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    },
    []
  );

  return useCallback(
    (...args: Params) => {
      const now = Date.now();
      const remainingTime = delay - (now - lastCall.current);

      if (remainingTime <= 0) {
        if (timeout.current) {
          clearTimeout(timeout.current);
          timeout.current = null;
        }

        pendingArgs.current = null;
        lastCall.current = now;
        return callbackRef.current(...args);
      }

      pendingArgs.current = args;

      if (!timeout.current) {
        timeout.current = setTimeout(() => {
          lastCall.current = Date.now();
          timeout.current = null;

          if (pendingArgs.current) {
            callbackRef.current(...pendingArgs.current);
            pendingArgs.current = null;
          }
        }, remainingTime);
      }
    },
    [delay]
  );
};

const hasMovedEnoughForPresence = (
  previous?: { x: number; y: number },
  next?: { x: number; y: number }
) => {
  if (!previous || !next) return true;

  return (
    Math.abs(previous.x - next.x) >= PRESENCE_POSITION_DELTA ||
    Math.abs(previous.y - next.y) >= PRESENCE_POSITION_DELTA
  );
};

const getLatestPresence = (presences: PresenceState[]) =>
  [...presences].sort((left, right) => {
    const leftSeq = left.seq ?? -1;
    const rightSeq = right.seq ?? -1;

    if (leftSeq !== rightSeq) {
      return rightSeq - leftSeq;
    }

    return (
      new Date(right.online_at).getTime() - new Date(left.online_at).getTime()
    );
  })[0];

export const generateRandomNumber = () => Math.floor(Math.random() * 100);

interface Player {
  position: {
    x: number;
    y: number;
  };
  user: {
    id: string;
    name: string;
    profile_url?: string;
    avatar?: string;
  };
  animation?: string;
  emote?: string | null;
}

export interface PlayerSnapshot extends Player {
  seq: number;
  timestamp: number;
}

export interface PresenceState {
  user_id: string;
  username: string;
  online_at: string;
  profile_url?: string;
  avatar?: string;
  position?: {
    x: number;
    y: number;
  };
  animation?: string;
  seq?: number;
}

export const useRealtimePlayers = ({
  roomName,
  username,
  userId,
  throttleMs,
  profile_url,
  avatar,
  initialPosition,
}: {
  roomName: string;
  userId: string;
  username: string;
  throttleMs: number;
  profile_url: string;
  avatar?: string;
  initialPosition: {
    x: number;
    y: number;
  };
}) => {
  const { setOnlineUsers } = useOnlineUsers();

  const playersRef = useRef<Record<string, PlayerSnapshot>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isConnectedRef = useRef(false);
  const localSequenceRef = useRef(0);
  const latestRemoteSequenceRef = useRef<Record<string, number>>({});
  const lastPresenceTrackRef = useRef<PresenceState | null>(null);
  const lastPresenceTrackAtRef = useRef(0);
  const lastLocalSnapshotRef = useRef<PlayerSnapshot | null>(null);
  const dirtyRemotePlayerIdsRef = useRef<Set<string>>(new Set());
  const removedRemotePlayerIdsRef = useRef<Set<string>>(new Set());

  const syncPresenceState = useCallback(
    (channel: RealtimeChannel) => {
      const presenceState = channel.presenceState<PresenceState>();
      const formattedUsers: Record<string, PresenceState> = {};
      const previousPlayers = playersRef.current;
      const nextPlayers: Record<string, PlayerSnapshot> = {};
      const nextSequences: Record<string, number> = {};

      Object.values(presenceState).forEach((presences) => {
        if (presences.length === 0) return;

        const latestPresence = getLatestPresence(presences as PresenceState[]);
        if (!latestPresence) return;

        formattedUsers[latestPresence.user_id] = latestPresence;

        if (latestPresence.user_id === userId) return;

        const seq = latestPresence.seq ?? 0;
        nextSequences[latestPresence.user_id] = seq;

        const currentSnapshot = playersRef.current[latestPresence.user_id];
        const currentSnapshotSeq = currentSnapshot?.seq ?? -1;

        if (currentSnapshot && currentSnapshotSeq > seq) {
          nextPlayers[latestPresence.user_id] = currentSnapshot;
          nextSequences[latestPresence.user_id] = currentSnapshotSeq;
          return;
        }

        if (latestPresence.position) {
          nextPlayers[latestPresence.user_id] = {
            position: latestPresence.position,
            user: {
              id: latestPresence.user_id,
              name: latestPresence.username,
              profile_url:
                latestPresence.profile_url || "default-avatar.png",
              avatar: latestPresence.avatar || DEFAULT_AVATAR,
            },
            animation:
              latestPresence.animation || currentSnapshot?.animation || DEFAULT_ANIMATION,
            emote: currentSnapshot?.emote ?? null,
            seq: Math.max(seq, currentSnapshot?.seq ?? 0),
            timestamp:
              currentSnapshot?.timestamp ??
              new Date(latestPresence.online_at).getTime(),
          };
          return;
        }

        if (currentSnapshot) {
          nextPlayers[latestPresence.user_id] = currentSnapshot;
          nextSequences[latestPresence.user_id] = currentSnapshot.seq;
        }
      });

      Object.keys(previousPlayers).forEach((playerId) => {
        if (!nextPlayers[playerId]) {
          removedRemotePlayerIdsRef.current.add(playerId);
          dirtyRemotePlayerIdsRef.current.delete(playerId);
        }
      });

      Object.entries(nextPlayers).forEach(([playerId, snapshot]) => {
        const previousSnapshot = previousPlayers[playerId];

        if (
          !previousSnapshot ||
          previousSnapshot.seq !== snapshot.seq ||
          previousSnapshot.emote !== snapshot.emote ||
          previousSnapshot.animation !== snapshot.animation ||
          previousSnapshot.position.x !== snapshot.position.x ||
          previousSnapshot.position.y !== snapshot.position.y
        ) {
          dirtyRemotePlayerIdsRef.current.add(playerId);
        }
      });

      playersRef.current = nextPlayers;
      latestRemoteSequenceRef.current = nextSequences;
      setOnlineUsers(formattedUsers);
    },
    [setOnlineUsers, userId]
  );

  const trackPresence = useCallback(
    async (snapshot: PlayerSnapshot, force = false) => {
      const channel = channelRef.current;
      if (!channel || !isConnectedRef.current) return;

      const nextPresence: PresenceState = {
        user_id: userId,
        username,
        online_at: new Date().toISOString(),
        profile_url,
        avatar: avatar || DEFAULT_AVATAR,
        position: snapshot.position,
        animation: snapshot.animation || DEFAULT_ANIMATION,
        seq: snapshot.seq,
      };

      const previousPresence = lastPresenceTrackRef.current;
      const timeSinceLastTrack = Date.now() - lastPresenceTrackAtRef.current;

      const shouldTrack =
        force ||
        !previousPresence ||
        previousPresence.animation !== nextPresence.animation ||
        hasMovedEnoughForPresence(previousPresence.position, nextPresence.position) ||
        timeSinceLastTrack >= PRESENCE_UPDATE_INTERVAL_MS;

      if (!shouldTrack) return;

      await channel.track(nextPresence);
      lastPresenceTrackRef.current = nextPresence;
      lastPresenceTrackAtRef.current = Date.now();
    },
    [avatar, profile_url, userId, username]
  );

  const syncPresenceSnapshot = useCallback(
    async (force = false) => {
      const snapshot = lastLocalSnapshotRef.current;
      if (!snapshot) return;

      await trackPresence(snapshot, force);
    },
    [trackPresence]
  );

  const callback = useCallback(
    (event: Player) => {
      const { position, user, animation, emote } = event;
      const seq = ++localSequenceRef.current;

      const payload: PlayerSnapshot = {
        position: {
          x: position.x,
          y: position.y,
        },
        user: {
          id: user.id || userId,
          name: user.name || username,
          profile_url: user.profile_url || profile_url,
          avatar: user.avatar || avatar || DEFAULT_AVATAR,
        },
        animation: animation || DEFAULT_ANIMATION,
        emote: emote ?? null,
        seq,
        timestamp: Date.now(),
      };

      const previousSnapshot = lastLocalSnapshotRef.current;
      lastLocalSnapshotRef.current = payload;

      void channelRef.current?.send({
        type: "broadcast",
        event: EVENT_NAME,
        payload,
      });

      const shouldRefreshPresence =
        !previousSnapshot ||
        previousSnapshot.animation !== payload.animation ||
        previousSnapshot.emote !== payload.emote;

      if (shouldRefreshPresence) {
        void trackPresence(payload, true);
      }
    },
    [avatar, profile_url, trackPresence, userId, username]
  );

  const handlePlayerMove = useThrottleCallback(callback, throttleMs);

  useEffect(() => {
    const channel = supabase.channel(roomName);
    channelRef.current = channel;
    playersRef.current = {};
    latestRemoteSequenceRef.current = {};
    localSequenceRef.current = 0;
    lastPresenceTrackRef.current = null;
    lastPresenceTrackAtRef.current = 0;
    lastLocalSnapshotRef.current = null;
    dirtyRemotePlayerIdsRef.current.clear();
    removedRemotePlayerIdsRef.current.clear();
    isConnectedRef.current = false;

    channel
      .on(
        "broadcast",
        { event: EVENT_NAME },
        (data: { payload: PlayerSnapshot }) => {
          const snapshot = data.payload;
          const remoteUserId = snapshot.user.id;

          if (remoteUserId === userId) return;

          const lastKnownSequence =
            latestRemoteSequenceRef.current[remoteUserId] ?? -1;

          if (snapshot.seq <= lastKnownSequence) return;

          latestRemoteSequenceRef.current[remoteUserId] = snapshot.seq;
          playersRef.current[remoteUserId] = snapshot;
          dirtyRemotePlayerIdsRef.current.add(remoteUserId);
        }
      )
      .on("presence", { event: "sync" }, () => {
        syncPresenceState(channel);
      })
      .on("presence", { event: "join" }, () => {
        syncPresenceState(channel);
      })
      .on("presence", { event: "leave" }, () => {
        syncPresenceState(channel);
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;

        isConnectedRef.current = true;

        const initialSnapshot: PlayerSnapshot = {
          position: initialPosition,
          user: {
            id: userId,
            name: username,
            profile_url,
            avatar: avatar || DEFAULT_AVATAR,
          },
          animation: DEFAULT_ANIMATION,
          emote: null,
          seq: localSequenceRef.current,
          timestamp: Date.now(),
        };

        lastLocalSnapshotRef.current = initialSnapshot;
        await syncPresenceSnapshot(true);
      });

    const heartbeat = window.setInterval(() => {
      void syncPresenceSnapshot();
    }, PRESENCE_HEARTBEAT_MS);
    const dirtyRemotePlayerIds = dirtyRemotePlayerIdsRef.current;
    const removedRemotePlayerIds = removedRemotePlayerIdsRef.current;

    return () => {
      window.clearInterval(heartbeat);
      isConnectedRef.current = false;
      playersRef.current = {};
      latestRemoteSequenceRef.current = {};
      dirtyRemotePlayerIds.clear();
      removedRemotePlayerIds.clear();
      lastLocalSnapshotRef.current = null;
      setOnlineUsers({});
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [
    avatar,
    initialPosition,
    profile_url,
    roomName,
    setOnlineUsers,
    syncPresenceState,
    syncPresenceSnapshot,
    trackPresence,
    userId,
    username,
  ]);

  return {
    dirtyRemotePlayerIdsRef,
    removedRemotePlayerIdsRef,
    playersRef,
    handlePlayerMove,
  };
};
