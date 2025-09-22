"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { ChatJoin } from "../chat-join";
import { User } from "../app-sidebar";

interface MessageType {
  id: string;
  content: string;
  username: string;
  created_at: string;
}

const ROOM_NAME = "general-chat";

interface GeneralChatProps {
  user: User;
}

export const GeneralChat = ({ user }: GeneralChatProps) => {
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
  );
};
