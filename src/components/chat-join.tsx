"use client";

import { RealtimeChat } from "./realtime-chat";
import { ChatMessage } from "@/hooks/use-realtime-chat";
import { storeMessages } from "@/lib/store-messages";
import { ProfileType } from "./profile-form";

export const ChatJoin = ({
  roomId,
  messages,
  user,
}: {
  roomId: string;
  messages?: ChatMessage[];
  user: ProfileType;
}) => {
  const handleOnMessage = async (messages: ChatMessage[]) => {
    await storeMessages(roomId, user.id, messages);
  };

  return (
    <RealtimeChat
      roomName={roomId}
      username={user.username}
      messages={messages}
      onMessage={handleOnMessage}
    />
  );
};
