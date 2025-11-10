"use client";

import { createContext, useContext, useState } from "react";

const EmoteContext = createContext<{
  emote: string | null;
  setEmote: (emote: string | null) => void;
}>({
  emote: null,
  setEmote: () => {},
});

export const EmoteProvider = ({ children }: React.PropsWithChildren) => {
  const [emote, setEmote] = useState<string | null>(null);

  return (
    <EmoteContext.Provider value={{ emote, setEmote }}>
      {children}
    </EmoteContext.Provider>
  );
};

export const useEmote = () => useContext(EmoteContext);
