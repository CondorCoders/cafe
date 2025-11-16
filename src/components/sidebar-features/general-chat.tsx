"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { ChatJoin } from "../chat-join";
import { ProfileType } from "../profile-form";

interface MessageType {
  id: string;
  content: string;
  username: string;
  created_at: string;
}

const ROOM_NAME = "general-chat";

interface GeneralChatProps {
  user: ProfileType;
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
  );
};
