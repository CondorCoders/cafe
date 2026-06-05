"use client";
import { PresenceState } from "@/hooks/use-realtime-players";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

const arePresenceMapsEqual = (
  left: Record<string, PresenceState>,
  right: Record<string, PresenceState>
) => {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) return false;

  return leftKeys.every((key) => {
    const leftPresence = left[key];
    const rightPresence = right[key];

    if (!rightPresence) return false;

    return (
      leftPresence.user_id === rightPresence.user_id &&
      leftPresence.username === rightPresence.username &&
      leftPresence.profile_url === rightPresence.profile_url &&
      leftPresence.avatar === rightPresence.avatar
    );
  });
};

const OnlineUsersContext = createContext<{
  onlineUsers: Record<string, PresenceState>;
  setOnlineUsers: React.Dispatch<
    React.SetStateAction<Record<string, PresenceState>>
  >;
}>({
  onlineUsers: {},
  setOnlineUsers: () => {},
});

export const OnlineUsersProvider = ({ children }: React.PropsWithChildren) => {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceState>>(
    {}
  );

  const setOnlineUsersGuarded = useCallback<
    React.Dispatch<React.SetStateAction<Record<string, PresenceState>>>
  >((nextValue) => {
    setOnlineUsers((current) => {
      const resolvedValue =
        typeof nextValue === "function" ? nextValue(current) : nextValue;

      return arePresenceMapsEqual(current, resolvedValue)
        ? current
        : resolvedValue;
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      onlineUsers,
      setOnlineUsers: setOnlineUsersGuarded,
    }),
    [onlineUsers, setOnlineUsersGuarded]
  );

  return (
    <OnlineUsersContext.Provider value={contextValue}>
      {children}
    </OnlineUsersContext.Provider>
  );
};

export const useOnlineUsers = () => useContext(OnlineUsersContext);
