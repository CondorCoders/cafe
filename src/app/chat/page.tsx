import { ChatJoin } from "@/components/chat-join";
import { createClient } from "@/lib/supabase/server";

const ROOM_NAME = "my-chat-room";

export default async function ChatPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("room", ROOM_NAME);

  return (
    <ChatJoin
      roomId={ROOM_NAME}
      messages={data?.map((message) => ({
        id: message.id,
        content: message.content,
        user: { name: message.username },
        createdAt: message.created_at,
      }))}
    />
  );
}
