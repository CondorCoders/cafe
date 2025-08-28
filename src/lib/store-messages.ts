import { ChatMessage } from "@/hooks/use-realtime-chat";
import { createClient } from "./supabase/client";

export const storeMessages = async (
  roomId: string,
  userId: string,
  messages: ChatMessage[]
) => {
  const supabase = createClient();

  if (!messages.length) {
    return;
  }

  const { error } = await supabase.from("messages").upsert(
    messages.map((message) => ({
      id: message.id,
      content: message.content,
      username: message.user.name,
      created_at: message.createdAt,
      user_id: userId,
      room: roomId,
    })),
    { onConflict: "id" }
  );

  if (error) {
    console.error("Error storing messages:", error);
  } else {
    console.log("Messages stored successfully");
  }
};
