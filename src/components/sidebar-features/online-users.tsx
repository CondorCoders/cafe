"use client";

import { useOnlineUsers } from "@/context/online-users-context";
import { Button } from "../ui/button";
import { createClient } from "@/lib/supabase/client";
import { ChatJoin } from "../chat-join";
import { User } from "../app-sidebar";
import { useEffect, useState } from "react";

const ROOM_NAME = "general-chat";

interface OnlineUsersProps {
  user: User;
}

interface MessageType {
  id: string;
  content: string;
  username: string;
  created_at: string;
}

export const OnlineUsers = ({ user }: OnlineUsersProps) => {
  const { onlineUsers } = useOnlineUsers();

  const supabase = createClient();
  const [messages, setMessages] = useState<MessageType[] | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("room", ROOM_NAME);
      setMessages(data);
    };
    fetchMessages();
  }, [supabase]);

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

      {/* Chat General Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
          Chat General
        </h3>
        <div className="flex-1 flex flex-col min-h-0">
          <ChatJoin
            user={user}
            roomId={ROOM_NAME}
            messages={messages?.map((message) => ({
              id: message.id,
              content: message.content,
              user: { name: message.username },
              createdAt: message.created_at,
            }))}
          />
        </div>
      </div>
    </div>
  );
};
