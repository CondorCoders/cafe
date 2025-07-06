import { ProfileForm, ProfileType } from "@/components/profile-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
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
    <div className="min-h-dvh flex w-full flex-col items-center p-6 md:p-10">
      <h1 className="text-2xl">Bienvenid@ al Cafe Virtual de CondorCoders</h1>
      <p>Personaliza tu perfil</p>
      <ProfileForm profile={profile} />
    </div>
  );
}
