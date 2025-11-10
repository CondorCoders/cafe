import { AppMenu } from "@/components/app-menu";
import { Game } from "@/components/game";
import { EmoteProvider } from "@/context/emote-context";
import { OnlineUsersProvider } from "@/context/online-users-context";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CafePage() {
  const supabase = await createClient();

  const userId = await supabase.auth
    .getUser()
    .then(({ data }) => data.user?.id);

  // COMENTADO: Verificacion de perfil deshabilitada para pruebas locales
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
    <OnlineUsersProvider>
      <EmoteProvider>
        <div className="relative w-full h-dvh overflow-hidden">
          <div className="w-full h-full">
            <AppMenu user={profile} />
            <main className="w-full h-full">
              <Game
                user={{
                  id: userId || "",
                  username: profile?.username || "Guest",
                  profile_url: profile?.profile_url || "default-avatar.png",
                  avatar: profile?.avatar,
                }}
              />
            </main>
          </div>
        </div>
      </EmoteProvider>
    </OnlineUsersProvider>
  );
}
