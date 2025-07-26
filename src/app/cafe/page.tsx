import { AppSidebar } from "@/components/app-sidebar";
import { Game } from "@/components/game";
import { SidebarProvider } from "@/components/ui/sidebar";
import { OnlineUsersProvider } from "@/context/online-users-context";
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
    <OnlineUsersProvider>
      <div className="relative w-full h-full">
        <SidebarProvider>
          <AppSidebar user={profile} />
          <main className="w-full h-full">
            <Game
              user={{
                id: userId || "",
                username: profile?.username || "Guest",
              }}
            />
          </main>
        </SidebarProvider>
      </div>
    </OnlineUsersProvider>
  );
}
