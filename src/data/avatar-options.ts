// Catálogo compartido de avatares soportados por la UI y por Phaser.
export const DEFAULT_AVATAR = "sofia";

export const avatarOptions = [
  {
    id: "1",
    name: "sofia",
    image: "/assets/characters-preview/sofia.png",
  },
  {
    id: "2",
    name: "luis",
    image: "/assets/characters-preview/luis.png",
  },
] as const;

export const availableAvatarNames = avatarOptions.map((avatar) => avatar.name);
