"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { Button } from "./ui/button";

export const LoginButton = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSocialLogin = async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "twitch",
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
    <Button onClick={handleSocialLogin} disabled={isLoading}>
      {isLoading ? "Logging in..." : "Login con Twitch"}
      {error && <p className="text-sm text-destructive-500">{error}</p>}
    </Button>
  );
};
