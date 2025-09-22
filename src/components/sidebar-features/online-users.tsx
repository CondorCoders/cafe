"use client";

import { useOnlineUsers } from "@/context/online-users-context";
import { Button } from "../ui/button";

export const OnlineUsers = () => {
  const { onlineUsers } = useOnlineUsers();

  return (
    <div className="w-full h-full flex flex-col p-4">
      {/* Online Users Section */}
      <div className="flex-shrink-0 mb-4">
        <ul className="w-full flex flex-col gap-2 max-h-32 overflow-y-auto">
          {Object.values(onlineUsers).map((presence) => (
            <li
              key={presence.user_id}
              className="w-full flex items-center gap-1"
            >
              <Button
                variant="ghost"
                className="w-full flex items-center justify-start gap-2"
              >
                <span className="text-sm">{presence.username}</span>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
