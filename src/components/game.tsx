"use client";

import {
  DEFAULT_PLAYER_SPAWN,
  generateRandomNumber,
  useRealtimePlayers,
} from "@/hooks/use-realtime-players";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoadingScreen } from "./loading-screen";
import { useEmote } from "@/context/emote-context";
import {
  createLocalAvatarAnimations,
  createRemoteAvatarAnimations,
  normalizeAvatar,
  preloadLocalAvatarAssets,
  preloadRemoteAvatarAssets,
} from "@/lib/game/avatar-assets";
import {
  interpolateRemotePlayers,
  type RemotePlayerRefs,
  syncDirtyRemotePlayersWithNetworkState,
} from "@/lib/game/remote-players";
import { setupGameFocusHandoff } from "@/lib/game/focus-handoff";
import { availableAvatarNames } from "@/data/avatar-options";

interface UserProfile {
  id: string;
  username: string;
  profile_url: string;
  avatar?: string;
}

interface GameProps {
  user?: UserProfile;
}

export const Game = ({ user }: GameProps) => {
  // 1. El punto central de integración.
  //    Aquí viven los refs de Phaser, la conexión con useRealtimePlayers
  //    y el ciclo de vida preload/create/update.
  const gameContainer = useRef<Phaser.Game | null>(null);
  const player = useRef<Phaser.Physics.Matter.Sprite | null>(null);
  const playerUsername = useRef<Phaser.GameObjects.Text | null>(null);
  const scene = useRef<Phaser.Scene | null>(null);
  const playersRefs = useRef<Record<string, Phaser.Physics.Matter.Sprite>>({});
  const playersUsernames = useRef<Record<string, Phaser.GameObjects.Text>>({});
  const [userId] = useState(user?.id || generateRandomNumber());
  const isInputFocusedRef = useRef(false);
  const lastFacing = useRef<"up" | "down" | "left" | "right">("down");
  const userIdString = useRef(userId.toString());
  const lastPlayerDepth = useRef(0);
  const remotePlayersDepth = useRef<Record<string, number>>({});
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cursorsRef = useRef<Phaser.Types.Input.Keyboard.CursorKeys | null>(
    null,
  );
  const wasdKeysRef = useRef<Record<string, Phaser.Input.Keyboard.Key> | null>(
    null,
  );
  const lastSentRef = useRef<{ x: number; y: number; animation?: string }>({
    x: 0,
    y: 0,
    animation: undefined,
  });
  const userProfileRef = useRef({
    username: user?.username || "Guest",
    profile_url: user?.profile_url || "default-avatar.png",
    avatar: user?.avatar || "sofia",
  });
  const userAvatarRef = useRef<string>(userProfileRef.current.avatar);
  const emoteRef = useRef<string | null>(null);
  const handlePlayerMoveRef = useRef<
    ReturnType<typeof useRealtimePlayers>["handlePlayerMove"] | null
  >(null);
  const syncRemotePlayersWithNetworkStateRef = useRef<(() => void) | null>(
    null,
  );
  const setEmoteRef = useRef<((emote: string | null) => void) | null>(null);
  const remoteAvatarRef = useRef<Record<string, string>>({});

  // Estados para la carga del juego
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const remotePlayerStates = useRef<
    Record<
      string,
      {
        prev: { x: number; y: number };
        next: { x: number; y: number };
        lastUpdate: number;
        lastSeq: number;
      }
    >
  >({});
  const remotePlayerRefs = useMemo<RemotePlayerRefs>(
    () => ({
      sprites: playersRefs,
      labels: playersUsernames,
      states: remotePlayerStates,
      depths: remotePlayersDepth,
      avatars: remoteAvatarRef,
    }),
    [],
  );

  const {
    dirtyRemotePlayerIdsRef,
    removedRemotePlayerIdsRef,
    playersRef,
    handlePlayerMove,
  } = useRealtimePlayers({
    roomName: "virtual-cafe",
    userId: userId.toString(),
    username: userProfileRef.current.username,
    profile_url: userProfileRef.current.profile_url,
    avatar: userProfileRef.current.avatar,
    initialPosition: DEFAULT_PLAYER_SPAWN,
    throttleMs: 150,
  });

  const { emote, setEmote } = useEmote();

  useEffect(() => {
    // 2. Ref espejo del perfil: Phaser usa estos valores desde callbacks
    //    y no queremos recrear la escena por cada render de React.
    userProfileRef.current = {
      username: user?.username || "Guest",
      profile_url: user?.profile_url || "default-avatar.png",
      avatar: user?.avatar || "sofia",
    };
    userAvatarRef.current = userProfileRef.current.avatar;
  }, [user?.avatar, user?.profile_url, user?.username]);

  useEffect(() => {
    // 3. La escena llama movimiento a través de un ref estable.
    handlePlayerMoveRef.current = handlePlayerMove;
  }, [handlePlayerMove]);

  useEffect(() => {
    // 4. Igual para setEmote: Phaser lo consume desde listeners propios.
    setEmoteRef.current = setEmote;
  }, [setEmote]);

  useEffect(() => {
    // 5. Traducimos el emote seleccionado a la variante direccional actual.
    if (emote) {
      emoteRef.current = `${emote}-${lastFacing.current}`;
    } else {
      emoteRef.current = null;
    }
  }, [emote]);

  const syncRemotePlayersWithNetworkState = useCallback(() => {
    // 6. Este callback solo orquesta:
    //    delega la reconciliación real a lib/game/remote-players.ts.
    syncDirtyRemotePlayersWithNetworkState({
      sceneRef: scene,
      localUserIdRef: userIdString,
      networkPlayersRef: playersRef,
      dirtyRemotePlayerIdsRef,
      removedRemotePlayerIdsRef,
      remotePlayerRefs,
    });
  }, [
    dirtyRemotePlayerIdsRef,
    playersRef,
    removedRemotePlayerIdsRef,
    remotePlayerRefs,
  ]);

  useEffect(() => {
    // 7. Phaser update() consume esta función vía ref para no acoplar
    //    la inicialización del juego a la identidad de callbacks de React.
    syncRemotePlayersWithNetworkStateRef.current =
      syncRemotePlayersWithNetworkState;
  }, [syncRemotePlayersWithNetworkState]);

  useEffect(() => {
    const initGame = async () => {
      // 8. Paso 1 del boot: esperar el contenedor real antes de crear Phaser.
      // Verificar que el contenedor existe antes de inicializar
      const container = document.getElementById("game-container");
      if (!container) {
        setTimeout(initGame, 100);
        return;
      }

      const Phaser = await import("phaser");

      function preload(this: Phaser.Scene) {
        // 9. Paso 2 del boot: cargar mapa, tiles y assets de avatar.
        // Configurar callbacks de progreso
        this.load.on("progress", (progress: number) => {
          const percentage = Math.round(progress * 70); // 70% para assets
          setLoadingProgress(percentage);
        });

        this.load.on("complete", () => {
          setLoadingProgress(85);
        });

        // Cargar assets
        this.load.image("atlas_48x", "assets/atlas_48x.png");
        this.load.image("interiors", "assets/Interiors_free_48x48.png");
        this.load.image("room_builder", "assets/Room_Builder_free_48x48.png");
        this.load.tilemapTiledJSON("tilemap", "assets/tilemap.json");
        preloadLocalAvatarAssets(this, normalizeAvatar(userAvatarRef.current));
        availableAvatarNames.forEach((avatar) => {
          preloadRemoteAvatarAssets(this, avatar);
        });
      }

      function create(this: Phaser.Scene) {
        // 10. Paso 3 del boot: crear mapa, jugador local, cámara y animaciones.
        scene.current = this;

        // Creación del mapa
        const map = this.make.tilemap({ key: "tilemap" });
        // Cargar los tilesets según el nombre en el JSON
        const tilesetAtlas = map.addTilesetImage("tileset_1", "atlas_48x");
        const tilesetInteriors = map.addTilesetImage("tileset_2", "interiors");
        const tilesetRoomBuilder = map.addTilesetImage(
          "tileset_3",
          "room_builder",
        );
        // Puedes agregar más tilesets si tu tilemap.json los tiene
        // Agrupa todos los tilesets en un array y filtra los null
        const tilesets = [
          tilesetAtlas,
          tilesetInteriors,
          tilesetRoomBuilder,
        ].filter(Boolean) as Phaser.Tilemaps.Tileset[];

        // Creación de las capas del mapa
        map.createLayer("Below Player", tilesets, 0, 0);
        map.createLayer("floor", tilesets, 0, 0);
        map.createLayer("carpets", tilesets, 0, 0);
        const chairsLayer = map.createLayer("chairs", tilesets, 0, 0)!;
        const wallsLayer = map.createLayer("walls", tilesets, 0, 0)!;
        const lowerFlowersLayer = map.createLayer(
          "lowerFlowers",
          tilesets,
          0,
          0,
        )!;
        const furnitureLayer = map.createLayer("furniture", tilesets, 0, 0)!;
        const tablesLayer = map.createLayer("tables", tilesets, 0, 0)!;
        const upperFlowersLayer = map.createLayer(
          "upperFlowers",
          tilesets,
          0,
          0,
        )!;
        map.createLayer("ornaments", tilesets, 0, 0);
        const doorsLayer = map.createLayer("doors", tilesets, 0, 0)!;
        const othersLayer = map.createLayer("others", tilesets, 0, 0)!;
        const upperPcLayer = map.createLayer("upperPc", tilesets, 0, 0)!;
        const abovePlayerLayer = map.createLayer(
          "Above Player",
          tilesets,
          0,
          0,
        );

        chairsLayer?.setCollisionByProperty({ collider: true });
        wallsLayer?.setCollisionByProperty({ collider: true });
        lowerFlowersLayer?.setCollisionByProperty({ collider: true });
        furnitureLayer?.setCollisionByProperty({ collider: true });
        tablesLayer?.setCollisionByProperty({ collider: true });
        othersLayer?.setCollisionByProperty({ collider: true });

        this.matter.world.convertTilemapLayer(chairsLayer);
        this.matter.world.convertTilemapLayer(wallsLayer);
        this.matter.world.convertTilemapLayer(lowerFlowersLayer);
        this.matter.world.convertTilemapLayer(furnitureLayer);
        this.matter.world.convertTilemapLayer(tablesLayer);
        this.matter.world.convertTilemapLayer(othersLayer);

        // Creación del jugador
        player.current = this.matter.add.sprite(
          DEFAULT_PLAYER_SPAWN.x,
          DEFAULT_PLAYER_SPAWN.y,
          "walk",
        );

        player.current.setBody({
          type: "rectangle",
          width: 28,
          height: 45,
        });
        player.current.setFixedRotation();
        player.current.setOrigin(0.5, 0.6);

        // Configuración de físicas optimizada para movimiento fluido
        player.current.setBounce(0);
        player.current.setFriction(0);
        player.current.setFrictionAir(0);
        player.current.setMass(1);

        // Configurar body para evitar rebotes y movimiento fluido
        if (player.current.body) {
          const body = player.current.body as MatterJS.BodyType;
          body.inertia = Infinity;
          body.sleepThreshold = -1; // Evita micro-rebotes
          body.slop = 0.05; // Tolerancia en colisiones para movimiento más suave
        }

        playerUsername.current = this.add.text(
          player.current.x,
          player.current.y - 40,
          userProfileRef.current.username,
          {
            fontSize: "12px",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: { x: 5, y: 2 },
          },
        );
        playerUsername.current.setOrigin(0.5, 0.5);

        // Establecer una profundidad alta para las capas que deben estar siempre por encima
        const topLayersDepth = 2000;
        upperFlowersLayer.setDepth(topLayersDepth);
        upperPcLayer.setDepth(topLayersDepth);
        abovePlayerLayer?.setDepth(topLayersDepth);
        doorsLayer.setDepth(topLayersDepth);

        const camera = this.cameras.main;
        camera.setZoom(1.5);
        camera.startFollow(player.current, true, 0.1, 0.1);
        camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        createLocalAvatarAnimations(this);
        availableAvatarNames.forEach((avatar) => {
          createRemoteAvatarAnimations(this, avatar);
        });

        // Ver si la animacion se detuvo
        player.current.on(
          "animationcomplete",
          (animation: Phaser.Animations.Animation) => {
            if (animation.key === emoteRef.current) {
              emoteRef.current = null;
              setEmoteRef.current?.(null);
              player.current?.anims.play(
                `idle-${lastFacing.current}` as const,
                true,
              );
            }
          },
        );

        // Crear controles del teclado una sola vez
        cursorsRef.current = this.input.keyboard?.createCursorKeys() || null;
        wasdKeysRef.current = this.input.keyboard?.addKeys({
          W: Phaser.Input.Keyboard.KeyCodes.W,
          A: Phaser.Input.Keyboard.KeyCodes.A,
          S: Phaser.Input.Keyboard.KeyCodes.S,
          D: Phaser.Input.Keyboard.KeyCodes.D,
        }) as unknown as Record<string, Phaser.Input.Keyboard.Key> | null;

        // Finalizar la carga
        setLoadingProgress(100);

        // Ocultar pantalla de carga después de una breve pausa
        loadingTimeoutRef.current = setTimeout(() => {
          setIsLoading(false);
          loadingTimeoutRef.current = null;
        }, 200);
      }

      function update(this: Phaser.Scene) {
        // 11. Paso 4 del loop: reconciliar remotos "dirty" antes
        //     de procesar input local e interpolación.
        syncRemotePlayersWithNetworkStateRef.current?.();

        if (emoteRef.current && player.current) {
          player.current?.setVelocity(0, 0);
          const currentAnim = player.current?.anims.currentAnim?.key;

          if (currentAnim !== emoteRef.current) {
            handlePlayerMoveRef.current?.({
              position: {
                x: player.current.x,
                y: player.current.y,
              },
              user: {
                id: userId.toString(),
                name: userProfileRef.current.username,
                profile_url: userProfileRef.current.profile_url,
                avatar: userProfileRef.current.avatar,
              },
              animation: currentAnim,
              emote: emoteRef.current,
            });
            player.current?.anims.play(emoteRef.current, true);
          }
          return;
        }
        // Verifica si un input está enfocado
        if (isInputFocusedRef.current) {
          player.current?.setVelocity(0, 0);
          player.current?.anims.play(
            `idle-${lastFacing.current}` as const,
            true,
          );

          // Actualizar posición del nombre de usuario del jugador
          playerUsername.current?.setPosition(
            player.current?.x || 0,
            (player.current?.y || 0) - 40,
          );

          if (player.current) {
            player.current.setDepth(player.current.y);
          }

          // Continuar manejando la interpolación para otros jugadores
          interpolateRemotePlayers({
            localUserIdRef: userIdString,
            remotePlayerRefs,
          });
          return; // Salir temprano, no procesar controles del juego
        }

        // Controles del juego cuando no hay input activo
        const cursors = cursorsRef.current;
        const keys = wasdKeysRef.current;

        const speed = 2.7;
        let velocityX = 0;
        let velocityY = 0;

        // Permitir comprobaciones independientes por eje para habilitar el movimiento diagonal.
        if (cursors || keys) {
          if (cursors?.left.isDown || keys?.A?.isDown) velocityX = -speed;
          if (cursors?.right.isDown || keys?.D?.isDown) velocityX = speed;
          if (cursors?.down.isDown || keys?.S?.isDown) velocityY = speed;
          if (cursors?.up.isDown || keys?.W?.isDown) velocityY = -speed;

          // Normalizar velocidad diagonal solo si hay movimiento en ambos ejes
          if (velocityX !== 0 && velocityY !== 0) {
            const mag = Math.hypot(velocityX, velocityY);
            if (mag > speed) {
              const scale = speed / mag;
              velocityX *= scale;
              velocityY *= scale;
            }
          }

          // Elegir animación: idle si no hay movimiento, o según dirección dominante
          if (velocityX === 0 && velocityY === 0) {
            player.current?.anims.play(
              `idle-${lastFacing.current}` as const,
              true,
            );
          } else {
            const absVelX = Math.abs(velocityX);
            const absVelY = Math.abs(velocityY);

            const direction =
              absVelX >= absVelY
                ? velocityX < 0
                  ? "left"
                  : "right"
                : velocityY < 0
                  ? "up"
                  : "down";

            lastFacing.current = direction;
            player.current?.anims.play(direction, true);
          }
        }

        player.current?.setVelocity(velocityX, velocityY);
        playerUsername.current?.setPosition(
          player.current?.x || 0,
          (player.current?.y || 0) - 40,
        );

        // Optimizar actualización de depth: solo actualizar si cambia >= 1 pixel
        if (player.current) {
          const newDepth = Math.floor(player.current.y);
          if (Math.abs(lastPlayerDepth.current - newDepth) >= 1) {
            player.current.setDepth(newDepth);
            lastPlayerDepth.current = newDepth;
          }
        }

        // INTERPOLACIÓN TEMPORAL PARA JUGADORES REMOTOS
        interpolateRemotePlayers({
          localUserIdRef: userIdString,
          remotePlayerRefs,
        });

        const currentAnimKey = player.current?.anims.currentAnim?.key;
        const hasAnimChanged = currentAnimKey !== lastSentRef.current.animation;

        // Detectar si está en movimiento (para decidir envío periódico)
        const isMoving = Math.abs(velocityX) > 0 || Math.abs(velocityY) > 0;

        // Enviar si:
        // - Cambió la animación (ej. mover->idle o idle->mover)
        // - O el jugador sigue moviéndose; el hook define la cadencia real de envío
        if (player.current && (hasAnimChanged || isMoving)) {
          handlePlayerMoveRef.current?.({
            position: {
              x: player.current.x,
              y: player.current.y,
            },
            user: {
              id: userId.toString(),
              name: userProfileRef.current.username,
              profile_url: userProfileRef.current.profile_url,
              avatar: userProfileRef.current.avatar,
            },
            animation: currentAnimKey,
          });

          lastSentRef.current = {
            x: player.current.x,
            y: player.current.y,
            animation: currentAnimKey,
          };
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        physics: {
          default: "matter",
          matter: {
            gravity: { y: 0, x: 0 },
            debug: false,
            enableSleeping: false, // Mantiene todos los cuerpos(Jugadores) activos todo el tiempo, necesario para respuesta inmediata en colisiones
          },
        },
        parent: "game-container",
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: "100%",
          height: "100%",
        },
        input: {
          keyboard: true,
        },
        scene: {
          preload,
          create,
          update,
        },

        render: {
          antialias: false, // Deshabilitar antialiasing para mejor rendimiento
          pixelArt: true, // Activar para pixel art
          roundPixels: true, // Redondear pixeles para mejor renderizado
        },
      };
      gameContainer.current = new Phaser.Game(config);
    };

    // Delay para asegurar que el DOM está listo
    const timer = setTimeout(() => {
      initGame();
    }, 100);

    return () => {
      // 12. Paso final: destruir Phaser y vaciar refs runtime del juego.
      clearTimeout(timer);
      // Limpiar timeout de carga si el componente se desmonta
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      if (gameContainer.current) {
        gameContainer.current.destroy(true);
        gameContainer.current = null;
      }
      scene.current = null;
      syncRemotePlayersWithNetworkStateRef.current = null;
      player.current = null;
      playerUsername.current = null;
      remotePlayerRefs.sprites.current = {};
      remotePlayerRefs.labels.current = {};
      remotePlayerRefs.states.current = {};
      remotePlayerRefs.depths.current = {};
      remotePlayerRefs.avatars.current = {};
    };
  }, [remotePlayerRefs, userId]);

  // Listeners para manejar el handoff de foco entre UI y Phaser
  useEffect(() => {
    // 13. Este efecto solo conecta el sistema de foco extraído.
    return setupGameFocusHandoff({
      sceneRef: scene,
      isInputFocusedRef,
    });
  }, []);

  return (
    <div className="relative h-full w-full">
      {/* Pantalla de carga */}
      {isLoading && <LoadingScreen loadingProgress={loadingProgress} />}

      {/* Container del juego */}
      <div
        id="game-container"
        className="h-full w-full"
        style={{
          position: "relative",
          zIndex: isLoading ? -1 : 1,
          opacity: isLoading ? 0 : 1,
          transition: "opacity 0.5s ease-in-out",
        }}
      ></div>
    </div>
  );
};
