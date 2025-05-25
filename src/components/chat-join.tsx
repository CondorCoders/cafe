"use client";

import { ChangeEvent, useState } from "react";
import { RealtimeChat } from "./realtime-chat";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ChatMessage } from "@/hooks/use-realtime-chat";
import { storeMessages } from "@/lib/store-messages";

export const ChatJoin = ({
  roomId,
  messages,
}: {
  roomId: string;
  messages?: ChatMessage[];
}) => {
  const [username, setUsername] = useState("john_doe");

  const handleUsername = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleOnMessage = async (messages: ChatMessage[]) => {
    await storeMessages(roomId, messages);
  };

  return (
    <>
      <div className="p-4">
        <Label htmlFor="username">Username</Label>
        <Input name="username" type="text" onChange={handleUsername} />
      </div>
      <RealtimeChat
        roomName={roomId}
        username={username}
        messages={messages}
        onMessage={handleOnMessage}
      />
      ;
    </>
  );
};
