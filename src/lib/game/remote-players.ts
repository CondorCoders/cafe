import {
  getIdleAnimation,
  getRemoteAnimationKey,
  getRemoteTextureKey,
  normalizeAvatar,
} from "@/lib/game/avatar-assets";
import type { PlayerSnapshot } from "@/hooks/use-realtime-players";
import type { MutableRefObject } from "react";

// 1. Este archivo encapsula el flujo de jugadores remotos:
//    - crear/destruir sprites
//    - aplicar avatar correcto
//    - reconciliar paquetes "dirty"
//    - interpolar movimiento para suavidad visual
export interface RemotePlayerInterpolationState {
  prev: { x: number; y: number };
  next: { x: number; y: number };
  lastUpdate: number;
  lastSeq: number;
}

export interface RemotePlayerRefs {
  sprites: MutableRefObject<Record<string, Phaser.Physics.Matter.Sprite>>;
  labels: MutableRefObject<Record<string, Phaser.GameObjects.Text>>;
  states: MutableRefObject<Record<string, RemotePlayerInterpolationState>>;
  depths: MutableRefObject<Record<string, number>>;
  avatars: MutableRefObject<Record<string, string>>;
}

interface SyncRemotePlayersParams {
  sceneRef: MutableRefObject<Phaser.Scene | null>;
  localUserIdRef: MutableRefObject<string>;
  networkPlayersRef: MutableRefObject<Record<string, PlayerSnapshot>>;
  dirtyRemotePlayerIdsRef: MutableRefObject<Set<string>>;
  removedRemotePlayerIdsRef: MutableRefObject<Set<string>>;
  remotePlayerRefs: RemotePlayerRefs;
}

interface InterpolateRemotePlayersParams {
  localUserIdRef: MutableRefObject<string>;
  remotePlayerRefs: RemotePlayerRefs;
}

export const destroyRemotePlayer = (
  playerId: string,
  remotePlayerRefs: RemotePlayerRefs
) => {
  // 2. Este cleanup debe borrar TODAS las referencias del jugador remoto.
  //    Si queda una sola viva, la siguiente reconexión puede renderizar mal.
  remotePlayerRefs.sprites.current[playerId]?.destroy();
  delete remotePlayerRefs.sprites.current[playerId];

  remotePlayerRefs.labels.current[playerId]?.destroy();
  delete remotePlayerRefs.labels.current[playerId];

  delete remotePlayerRefs.states.current[playerId];
  delete remotePlayerRefs.depths.current[playerId];
  delete remotePlayerRefs.avatars.current[playerId];
};

export const applyRemoteAvatar = (
  remotePlayer: Phaser.Physics.Matter.Sprite,
  playerId: string,
  requestedAvatar: string | undefined,
  remotePlayerRefs: RemotePlayerRefs
) => {
  // 3. Antes de animar un remoto, aseguramos que el sprite tenga
  //    la textura del avatar correcto.
  const resolvedAvatar = normalizeAvatar(requestedAvatar);
  const currentAvatar = remotePlayerRefs.avatars.current[playerId];

  if (currentAvatar === resolvedAvatar) {
    return resolvedAvatar;
  }

  remotePlayer.setTexture(getRemoteTextureKey(resolvedAvatar, "walk"));
  remotePlayerRefs.avatars.current[playerId] = resolvedAvatar;
  remotePlayer.setData("avatar", resolvedAvatar);

  return resolvedAvatar;
};

export const syncDirtyRemotePlayersWithNetworkState = ({
  sceneRef,
  localUserIdRef,
  networkPlayersRef,
  dirtyRemotePlayerIdsRef,
  removedRemotePlayerIdsRef,
  remotePlayerRefs,
}: SyncRemotePlayersParams) => {
  // 4. Paso principal de reconciliación.
  //    Este método NO recorre todos los jugadores por frame:
  //    solo procesa removidos y remotos marcados como dirty.
  const scene = sceneRef.current;
  if (!scene) return;

  const now = Date.now();
  const networkPlayers = networkPlayersRef.current;
  const removedPlayerIds = Array.from(removedRemotePlayerIdsRef.current);

  // 5. Primero limpiamos los jugadores que ya no existen en el estado de red.
  removedPlayerIds.forEach((remotePlayerId) => {
    destroyRemotePlayer(remotePlayerId, remotePlayerRefs);
    removedRemotePlayerIdsRef.current.delete(remotePlayerId);
  });

  const dirtyPlayerIds = Array.from(dirtyRemotePlayerIdsRef.current);
  dirtyPlayerIds.forEach((id) => {
    dirtyRemotePlayerIdsRef.current.delete(id);
    const playerData = networkPlayers[id];
    if (!playerData || id === localUserIdRef.current) return;

    let remotePlayer = remotePlayerRefs.sprites.current[id];
    let nameLabel = remotePlayerRefs.labels.current[id];

    if (!remotePlayer) {
      // 6. Si el sprite todavía no existe, lo creamos con su body,
      //    etiqueta y avatar inicial.
      remotePlayer = scene.matter.add.sprite(
        playerData.position.x,
        playerData.position.y,
        getRemoteTextureKey(normalizeAvatar(playerData.user.avatar), "walk")
      );

      remotePlayer.setDepth(playerData.position.y);
      remotePlayer.setBody({
        type: "rectangle",
        width: 32,
        height: 48,
      });
      remotePlayer.setFixedRotation();
      remotePlayer.setOrigin(0.5, 0.6);
      remotePlayer.setSensor(true);

      nameLabel = scene.add.text(
        remotePlayer.x,
        remotePlayer.y - 40,
        playerData.user.name || "Guest",
        {
          fontSize: "12px",
          color: "#ffffff",
          backgroundColor: "#000000",
          padding: { x: 5, y: 2 },
        }
      );
      nameLabel.setOrigin(0.5, 0.5);

      remotePlayerRefs.sprites.current[id] = remotePlayer;
      remotePlayerRefs.avatars.current[id] = normalizeAvatar(
        playerData.user.avatar
      );
      remotePlayerRefs.labels.current[id] = nameLabel;
    }

    // 7. Revalidamos avatar por si el usuario cambió su skin.
    const resolvedAvatar = applyRemoteAvatar(
      remotePlayer,
      id,
      playerData.user.avatar,
      remotePlayerRefs
    );

    const existingState = remotePlayerRefs.states.current[id];
    if (!existingState) {
      // 8. Primer paquete recibido: usamos la misma posición como prev/next.
      remotePlayerRefs.states.current[id] = {
        prev: { x: playerData.position.x, y: playerData.position.y },
        next: { x: playerData.position.x, y: playerData.position.y },
        lastUpdate: now,
        lastSeq: playerData.seq,
      };
    } else if (playerData.seq > existingState.lastSeq) {
      // 9. Paquete nuevo: guardamos dónde estaba el sprite y
      //    cuál es su nuevo destino para interpolarlo en update().
      existingState.prev = {
        x: remotePlayer.x,
        y: remotePlayer.y,
      };
      existingState.next = {
        x: playerData.position.x,
        y: playerData.position.y,
      };
      existingState.lastUpdate = now;
      existingState.lastSeq = playerData.seq;
    }

    nameLabel?.setText(playerData.user.name || "Guest");

    if (playerData.emote) {
      // 10. Los emotes son eventos puntuales.
      //     Se reproducen una vez y luego volvemos al idle correspondiente.
      const lastHandledEmoteSeq = remotePlayer.getData("emoteSeq") as
        | number
        | undefined;
      const emoteAnimationKey = getRemoteAnimationKey(
        resolvedAvatar,
        playerData.emote
      );

      if (lastHandledEmoteSeq !== playerData.seq) {
        remotePlayer.setData("emoteSeq", playerData.seq);
        remotePlayer.anims.play(emoteAnimationKey, true);
        remotePlayer.once(
          "animationcomplete",
          (animation: Phaser.Animations.Animation) => {
            if (!remotePlayer.scene) return;

            if (animation.key === emoteAnimationKey) {
              remotePlayer.anims.play(
                getRemoteAnimationKey(
                  resolvedAvatar,
                  getIdleAnimation(playerData.animation)
                ),
                true
              );
            }
          }
        );
      }
    } else if (
      playerData.animation &&
      remotePlayer.anims?.currentAnim?.key !==
        getRemoteAnimationKey(resolvedAvatar, playerData.animation)
    ) {
      remotePlayer.anims.play(
        getRemoteAnimationKey(resolvedAvatar, playerData.animation),
        true
      );
    }
  });
};

export const interpolateRemotePlayers = ({
  localUserIdRef,
  remotePlayerRefs,
}: InterpolateRemotePlayersParams) => {
  // 11. Segundo paso del flujo remoto:
  //     la reconciliación define "prev" y "next",
  //     y esta función suaviza el movimiento entre ambos puntos.
  const interpolationDuration = 140;
  const now = Date.now();

  for (const id in remotePlayerRefs.sprites.current) {
    if (id === localUserIdRef.current) continue;

    const sprite = remotePlayerRefs.sprites.current[id];
    const state = remotePlayerRefs.states.current[id];

    if (sprite && state) {
      const t = Math.min(
        (now - state.lastUpdate) / interpolationDuration,
        1
      );

      sprite.x = state.prev.x + (state.next.x - state.prev.x) * t;
      sprite.y = state.prev.y + (state.next.y - state.prev.y) * t;

      if (t >= 1) {
        sprite.x = state.next.x;
        sprite.y = state.next.y;
      }

      remotePlayerRefs.labels.current[id]?.setPosition(sprite.x, sprite.y - 40);

      const newDepth = Math.floor(sprite.y);
      if (
        Math.abs((remotePlayerRefs.depths.current[id] || 0) - newDepth) >= 1
      ) {
        sprite.setDepth(newDepth);
        remotePlayerRefs.depths.current[id] = newDepth;
      }
    }
  }
};
