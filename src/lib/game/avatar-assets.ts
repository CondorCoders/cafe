import { animationsConfig } from "@/data/animations";
import { availableAvatarNames, DEFAULT_AVATAR } from "@/data/avatar-options";

// 1. Este archivo concentra todo lo necesario para resolver
//    texturas y animaciones de avatar dentro de Phaser.
const animationAssetKeys = Object.keys(animationsConfig) as Array<
  keyof typeof animationsConfig
>;
const availableAvatarNamesSet = new Set<string>(availableAvatarNames);

// 2. Cuando llega una animación genérica ("up", "left", etc.),
//    esta función la convierte a la variante idle si hace falta.
export const getIdleAnimation = (animation?: string) => {
  if (!animation) return "idle-down";
  if (animation.startsWith("idle-")) return animation;
  if (["up", "down", "left", "right"].includes(animation)) {
    return `idle-${animation}`;
  }

  return "idle-down";
};

export const getRemoteTextureKey = (avatar: string, assetKey: string) =>
  `${avatar}:${assetKey}`;

export const getRemoteAnimationKey = (avatar: string, animationKey: string) =>
  `${avatar}:${animationKey}`;

// 3. Toda la app usa este normalizador para evitar pedir assets
//    inexistentes. Si el avatar no está soportado, se usa el default.
export const normalizeAvatar = (avatar?: string) =>
  avatar && availableAvatarNamesSet.has(avatar) ? avatar : DEFAULT_AVATAR;

// Local player assets intentionally use the original non-namespaced keys because
// the local sprite and input flow still play bare animation names like "down".
// 4. Flujo local:
//    - preloadLocalAvatarAssets() carga spritesheets con keys simples
//    - createLocalAvatarAnimations() crea animaciones simples
//    - Game usa esas keys directamente para el jugador local
export const preloadLocalAvatarAssets = (
  scene: Phaser.Scene,
  avatar: string
) => {
  animationAssetKeys.forEach((assetKey) => {
    scene.load.spritesheet(
      assetKey,
      `assets/characters/${avatar}/${assetKey}.png`,
      {
        frameWidth: 64,
        frameHeight: 64,
      }
    );
  });
};

// Remote players use namespaced texture/animation keys so multiple avatars can
// coexist in the same scene without colliding with the local player's keys.
// 5. Flujo remoto:
//    - preloadRemoteAvatarAssets() carga spritesheets namespaced por avatar
//    - createRemoteAvatarAnimations() crea animaciones namespaced
//    - remote-players.ts usa esas keys para que varios avatares convivan
export const preloadRemoteAvatarAssets = (
  scene: Phaser.Scene,
  avatar: string
) => {
  animationAssetKeys.forEach((assetKey) => {
    scene.load.spritesheet(
      getRemoteTextureKey(avatar, assetKey),
      `assets/characters/${avatar}/${assetKey}.png`,
      {
        frameWidth: 64,
        frameHeight: 64,
      }
    );
  });
};

// 6. Este paso crea las animaciones del jugador local una sola vez por escena.
export const createLocalAvatarAnimations = (scene: Phaser.Scene) => {
  animationAssetKeys.forEach((assetKey) => {
    animationsConfig[assetKey].forEach((animation) => {
      const { key, start, end } = animation;
      const idleFrame =
        "idleFrame" in animation ? animation.idleFrame : undefined;
      const repeat = "repeat" in animation ? animation.repeat : -1;

      if (scene.anims.exists(key)) return;

      if (idleFrame !== undefined) {
        scene.anims.create({
          key,
          frames: [{ key: assetKey, frame: idleFrame }],
          frameRate: 10,
          repeat,
        });
        return;
      }

      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(assetKey, {
          start,
          end,
        }),
        frameRate: 10,
        repeat,
      });
    });
  });
};

// 7. Este paso crea las animaciones remotas namespaced por avatar.
//    Asi "sofia:down" y "luis:down" pueden existir al mismo tiempo.
export const createRemoteAvatarAnimations = (
  scene: Phaser.Scene,
  avatar: string
) => {
  animationAssetKeys.forEach((assetKey) => {
    const textureKey = getRemoteTextureKey(avatar, assetKey);

    animationsConfig[assetKey].forEach((animation) => {
      const sceneAnimationKey = getRemoteAnimationKey(avatar, animation.key);
      if (scene.anims.exists(sceneAnimationKey)) return;

      const idleFrame =
        "idleFrame" in animation ? animation.idleFrame : undefined;
      const repeat = "repeat" in animation ? animation.repeat : -1;

      if (idleFrame !== undefined) {
        scene.anims.create({
          key: sceneAnimationKey,
          frames: [{ key: textureKey, frame: idleFrame }],
          frameRate: 10,
          repeat,
        });
        return;
      }

      scene.anims.create({
        key: sceneAnimationKey,
        frames: scene.anims.generateFrameNumbers(textureKey, {
          start: animation.start,
          end: animation.end,
        }),
        frameRate: 10,
        repeat,
      });
    });
  });
};
