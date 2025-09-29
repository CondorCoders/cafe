import { LoginButton } from "@/components/login-button";
import { Navbar } from "@/components/navbar";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();

  const userId = await supabase.auth
    .getUser()
    .then(({ data }) => data.user?.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return (
    <div className="font-[family-name:var(--font-geist-sans)]">
      <Navbar user={userId ? { id: userId, ...profile } : null} />
      <main className="flex flex-col gap-[32px]">
        <section className="w-full min-h-screen mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col ml-auto justify-center max-w-2xl gap-6 p-4">
            <h1 className="text-6xl text-left font-jersey leading-[0.8]">
              El <span className="text-purple">coworking virtual</span> de la
              comunidad de programación{" "}
              <span className="text-purple">CondorCoders</span>
            </h1>
            <p className="text-xl">
              Chatea con otros devs, usa pomodoros, escucha música y toma notas
              mientras estudias en comunidad.
            </p>
            <div className="flex gap-4">
              {userId ? (
                <Link
                  href="/cafe"
                  className={buttonVariants({ variant: "default" })}
                >
                  Ir al café
                </Link>
              ) : (
                <LoginButton />
              )}
              <Link
                className={buttonVariants({ variant: "outline" })}
                href="https://github.com/CondorCoders/cafe"
                target="_blank"
              >
                Ver en GitHub
              </Link>
            </div>
          </div>

          <div className="w-full h-full bg-[url(/assets/mapa.png)] bg-center bg-no-repeat bg-cover">
            <div className="w-full h-full flex flex-col justify-center items-center bg-gradient-to-b from-purple/70 via-pink-300/70 to-blue-300/70">
              <div className="relative aspect-square w-full md:w-sm">
                <Image
                  src="/assets/characters-preview/sofia.png"
                  alt="Hero"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer>Hecho con ❤️ por la comunidad de CondorCoders</footer>
    </div>
  );
}
