"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { Button } from "./ui/button";

export const LoginButton = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<"google" | "twitch">("twitch");

  const handleSocialLogin = async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/oauth?next=/cafe`,
        },
      });

      if (error) throw error;
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
      setIsLoading(false);
    }
  };
  return (
    <div className="flex gap-2">
      <Button
        variant={provider === "google" ? "default" : "outline"}
        onClick={() => setProvider("google")}
      >
        {isLoading ? "Conectando..." : `Entrar con Google`}
      </Button>
      {/* Botón principal */}
      <Button onClick={handleSocialLogin} disabled={isLoading}>
        {isLoading ? "Conectando..." : `Entrar con ${provider}`}
      </Button>{" "}
      {error && <p className="text-sm text-destructive-500">{error}</p>}
    </div>
  );
};
