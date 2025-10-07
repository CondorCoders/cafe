"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/button";

const POMODORO_TIME = 25 * 60;
const SHORT_BREAK_TIME = 10 * 60;

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  // Ejemplo: 05:09
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

export const Pomodoro = () => {
  const [time, setTime] = useState<number>(POMODORO_TIME);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isBreak, setIsBreak] = useState<boolean>(false);

  useEffect(() => {
    if (!isRunning) return;

    const audio = new Audio("/music/notification.wav");

    if (time === 0) {
      if (isBreak) {
        setIsBreak(false);
        setTime(POMODORO_TIME);
      } else {
        setIsBreak(true);
        setTime(SHORT_BREAK_TIME);
      }
    }

    // play notification sound
    if (time === 1) {
      audio.play().catch(console.error);
    }

    const interval = setInterval(() => {
      setTime((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, time, isBreak]);

  return (
    <div className="w-full p-4 flex flex-col gap-2 items-center">
      <h2>{isBreak ? "Descanso ☕" : "Hora de Trabajar ⏳"}</h2>
      <time className="text-4xl">{formatTime(time)}</time>
      <div className="w-full flex gap-2 items-center justify-center">
        <Button
          variant="outline"
          onClick={() => setIsRunning(!isRunning)}
          className="min-w-24"
        >
          {isRunning ? "Pausar" : "Empezar"}
        </Button>
        <Button
          variant="outline"
          className="min-w-24"
          onClick={() => {
            setIsRunning(false);
            setIsBreak(false);
            setTime(POMODORO_TIME);
          }}
        >
          Reiniciar
        </Button>
      </div>
    </div>
  );
};
