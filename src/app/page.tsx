import { LoginButton } from "@/components/login-button";
import { Navbar } from "@/components/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { contribuyentes } from "@/data/contribuyentes";
import { createClient } from "@/lib/supabase/server";
import { Clock, MessageCircle, Music } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const features = [
  {
    title: "Chatea con otros devs",
    description:
      "Conéctate y colabora con otros desarrolladores en tiempo real.",
    icon: MessageCircle,
  },
  {
    title: "Escucha música",
    description:
      "Disfruta de una selección curada de música para mantenerte enfocado.",
    icon: Music,
  },
  {
    title: "Usa un Pomodoro",
    description:
      "Mejora tu productividad con nuestra herramienta integrada de Pomodoro.",
    icon: Clock,
  },
];

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
      <main className="flex flex-col bg-[#EFEFED]">
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
        <section className="bg-purple/5 px-4 py-16">
          <div className="w-full max-w-7xl mx-auto">
            <h2 className="font-jersey text-5xl tracking-wide">
              ¿Qué puedes hacer aquí?
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <li
                  key={feature.title}
                  className="mt-4 text-2xl shadow-lg rounded-2xl p-4"
                >
                  <feature.icon className="size-6 mb-2 text-purple" />
                  <h3 className="font-bold">{feature.title}</h3>
                  <p className="text-base">{feature.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section>
          <div className="w-full max-w-7xl mx-auto text-center py-16 px-4">
            <h2 className="font-jersey text-5xl tracking-wide">
              Contribuyentes
            </h2>
            <div className="w-fit mx-auto items-center justify-center flex flex-row flex-wrap gap-2 hover:gap-7 transition-[gap] px-4 py-10">
              {contribuyentes.map((contribuyente) => (
                <div
                  key={contribuyente.name}
                  className="flex flex-col items-center *:-ml-7 first:ml-0"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={contribuyente.github} target="_blank">
                        <Avatar className="size-20 hover:drop-shadow-lg/50 drop-shadow-purple hover:cursor-pointer hover:scale-125 transition-transform">
                          <AvatarImage src={contribuyente.avatar} />
                          <AvatarFallback>
                            {contribuyente.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>{contribuyente.name}</TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full bg-purple-950 text-white text-center p-4">
        Hecho con ❤️ por la comunidad de CondorCoders
      </footer>
    </div>
  );
}
