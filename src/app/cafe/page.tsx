import { Game } from "@/components/game";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CafePage() {
  const supabase = await createClient();

  const userId = await supabase.auth
    .getUser()
    .then(({ data }) => data.user?.id);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    redirect("/auth/login");
  }

  return (
    <Game
      user={{
        id: userId || "",
        username: profile?.username || "Guest",
      }}
    />
  );
}
