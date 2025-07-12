// import { createClient } from "@/lib/supabase/server";
// import { redirect } from "next/navigation";

export default async function ProfilePage() {
  // const supabase = await createClient();

  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();

  // if (!user) {
  //   redirect("/auth/login");
  // }

  // const { data: profile, error } = await supabase
  //   .from("profiles")
  //   .select("*")
  //   .eq("id", user.id)
  //   .single();

  return <div>ProfilePage</div>;
}
