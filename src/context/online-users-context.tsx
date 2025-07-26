"use client";
import { PresenceState } from "@/hooks/use-realtime-players";
import { createContext, useContext, useState } from "react";

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

  return (
    <OnlineUsersContext.Provider value={{ onlineUsers, setOnlineUsers }}>
      {children}
    </OnlineUsersContext.Provider>
  );
};

export const useOnlineUsers = () => useContext(OnlineUsersContext);
