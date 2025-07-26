"use client";

import { useOnlineUsers } from "@/context/online-users-context";

export const OnlineUsers = () => {
  const { onlineUsers } = useOnlineUsers();

  return (
    <div>
      <h3>Conectados</h3>
      <ul>
        {Object.values(onlineUsers).map((presence) => (
          <li key={presence.user_id} className="flex items-center gap-2">
            <span className="text-sm">{presence.username}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
