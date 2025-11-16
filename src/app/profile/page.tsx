import { ProfileForm, ProfileType } from "@/components/profile-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<ProfileType>();

  if (!profile || error) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-purple/70 via-pink-300/70 to-blue-300/70 flex w-full flex-col gap-4 items-center justify-center p-6 md:p-10">
      <h1 className="text-2xl">Personaliza tu perfil</h1>
      <ProfileForm profile={profile} />
    </div>
  );
}
