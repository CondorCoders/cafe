import { animationsConfig } from "@/data/animations";
import { Button } from "../ui/button";
import { useEmote } from "@/context/emote-context";

const emotes = Object.keys(animationsConfig).filter(
  (animation) => animation !== "walk"
);

export const Emotes = () => {
  const { emote, setEmote } = useEmote();

  return (
    <div className="p-2">
      {emotes.map((e) => (
        <Button
          key={e}
          variant={e === emote ? "secondary" : "outline"}
          onClick={() => setEmote(e)}
          disabled={e === emote}
        >
          {e}
        </Button>
      ))}
    </div>
  );
};
