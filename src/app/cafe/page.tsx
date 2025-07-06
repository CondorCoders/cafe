import { Game } from "@/components/game";
import { createClient } from "@/lib/supabase/server";

export default async function CafePage() {
  const supabase = await createClient();

  const userId = await supabase.auth
    .getUser()
    .then(({ data }) => data.user?.id);
  return <Game userId={userId} />;
}
