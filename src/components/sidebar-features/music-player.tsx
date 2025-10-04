"use client";

import { SkipBack, SkipForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";

const playlist = [
  { id: 1, title: "Pixel Dreams", url: "/music/Pixel-Dreams.mp3" },
  { id: 2, title: "Pixel Dreams Remix", url: "/music/Pixel-Dreams-Remix.mp3" },
];

export const MusicPlayer = () => {
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Update the audio source
    audio.src = playlist[currentTrack].url;
    audio.load(); // Reload the audio element with new source

    // If music was playing, start the new track from beginning
    if (isPlaying) {
      audio.currentTime = 0;
      audio.play().catch(console.error);
    }
  }, [currentTrack, isPlaying]);

  const handlePrevious = () => {
    setCurrentTrack((prev) => (prev > 0 ? prev - 1 : playlist.length - 1));
  };

  const handleNext = () => {
    setCurrentTrack((prev) => (prev < playlist.length - 1 ? prev + 1 : 0));
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  return (
    <div className="p-4 flex flex-col space-y-2">
      <h3>{playlist[currentTrack].title}</h3>
      <audio
        ref={audioRef}
        controls
        className="w-full"
        src={playlist[currentTrack].url}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleNext} // Auto-advance to next track when current ends
      >
        Your browser does not support the audio element.
      </audio>
      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={handlePrevious}>
          <SkipBack />
        </Button>
        <Button variant="outline" onClick={handleNext}>
          <SkipForward />
        </Button>
      </div>
    </div>
  );
};
