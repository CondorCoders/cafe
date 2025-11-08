// Animaciones del jugador - Configuración optimizada
export const animationsConfig = {
  walk: [
    { key: "up", start: 0, end: 8 },
    { key: "left", start: 9, end: 17 },
    { key: "down", start: 18, end: 26 },
    { key: "right", start: 27, end: 35 },
    { key: "idle-up", idleFrame: 5 },
    { key: "idle-left", idleFrame: 9 },
    { key: "idle-down", idleFrame: 19 },
    { key: "idle-right", idleFrame: 27 },
  ],
  dance: [
    { key: "dance-up", start: 0, end: 5, repeat: 3 },
    { key: "dance-left", start: 6, end: 11, repeat: 3 },
    { key: "dance-down", start: 12, end: 17, repeat: 3 },
    { key: "dance-right", start: 18, end: 23, repeat: 3 },
  ],
};
