"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    const setup = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      // verificar si el perfil existe
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // si no existe → crear uno con valores por defecto
      if (!profile) {
        await supabase.from("profiles").insert({
          id: user.id,
          username: user.email?.split("@")[0] ?? "Usuario",
          avatar_url: null,
        });
      }

      // ahora sí → ir al mapa
      router.push("/cafe");
    };

    setup();
  }, [router]);

  return (
    <div className="p-4 text-center text-muted-foreground">
      Cargando perfil...
    </div>
  );
}
