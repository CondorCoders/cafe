"use client";

import { useOnlineUsers } from "@/context/online-users-context";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export const OnlineUsers = () => {
  const { onlineUsers } = useOnlineUsers();

  return (
    <div className="w-full h-full flex flex-col px-4 pt-2">
      <ul className="w-full flex flex-col gap-3 max-h-32 overflow-y-auto py-2">
        {Object.values(onlineUsers).map((presence) => (
          <li key={presence.user_id} className="w-full flex items-center gap-1">
            <Avatar className="size-6">
              <AvatarImage src={presence.profile_url} />
              <AvatarFallback className="bg-indigo-300">
                {presence.username.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{presence.username}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
