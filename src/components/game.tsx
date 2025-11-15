"use client";

import {
  generateRandomNumber,
  useRealtimePlayers,
} from "@/hooks/use-realtime-players";
import { useEffect, useRef, useState } from "react";
import { LoadingScreen } from "./loading-screen";
import { animationsConfig } from "@/data/animations";
import { useEmote } from "@/context/emote-context";

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
    null
  );
  const wasdKeysRef = useRef<Record<string, Phaser.Input.Keyboard.Key> | null>(
    null
  );
  // Control de envío local para evitar spam a Realtime
  const lastBroadcastRef = useRef(0);
  const lastSentRef = useRef<{ x: number; y: number; animation?: string }>({
    x: 0,
    y: 0,
    animation: undefined,
  });
  const userAvatarRef = useRef<string>(user?.avatar || "sofia");
  const emoteRef = useRef<string | null>(null);
  // Intervalo local mínimo entre envíos (ms)
  const LOCAL_BROADCAST_MS = 150;

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
      }
    >
  >({});

  const { players, handlePlayerMove } = useRealtimePlayers({
    roomName: "virtual-cafe",
    userId: userId.toString(),
    username: user?.username || "Guest",
    profile_url: user?.profile_url || "default-avatar.png",
    avatar: user?.avatar || "sofia",
    // Reducción de frecuencia de broadcast a nivel hook
    throttleMs: 150,
  });

  const { emote, setEmote } = useEmote();

  // Referencia para acceder a players en Phaser sin recrear el juego
  const playersData = useRef(players);

  // Actualizar la referencia cuando cambien los players
  useEffect(() => {
    playersData.current = players;
  }, [players]);

  useEffect(() => {
    if (emote) {
      emoteRef.current = `${emote}-${lastFacing.current}`;
    } else {
      emoteRef.current = null;
    }
  }, [emote]);

  useEffect(() => {
    if (!gameContainer.current) return;

    // 1. Crear/actualizar jugadores existentes
    const now = Date.now();
    Object.entries(players).forEach(([id, playerData]) => {
      // Guardar posiciones previas y nuevas para **interpolación temporal**
      if (id !== userIdString.current) {
        if (!remotePlayerStates.current[id]) {
          remotePlayerStates.current[id] = {
            prev: { x: playerData?.position.x, y: playerData?.position.y },
            next: { x: playerData?.position.x, y: playerData?.position.y },
            lastUpdate: now,
          };
        } else {
          const state = remotePlayerStates.current[id];

          const sprite = playersRefs.current[id];
          if (sprite) {
            state.prev.x = sprite.x;
            state.prev.y = sprite.y;
          } else {
            // fallback: conservar el comportamiento previo
            state.prev.x = state.next.x;
            state.prev.y = state.next.y;
          }

          state.next.x = playerData?.position.x;
          state.next.y = playerData?.position.y;
          state.lastUpdate = now;
        }
      }
      if (!playersRefs.current[id] && playerData?.animation) {
        const newPlayer = scene.current?.matter.add.sprite(
          playerData?.position.x,
          playerData?.position.y,
          playerData?.animation
        );
        newPlayer?.setDepth(playerData?.position.y);
        newPlayer?.setBody({
          type: "rectangle",
          width: 32,
          height: 48,
        });
        newPlayer?.setFixedRotation();
        newPlayer?.setOrigin(0.5, 0.6);
        // CAMBIO: Hacer que los jugadores remotos sean sensores
        if (id !== userIdString.current) {
          newPlayer?.setSensor(true); // CAMBIO: Jugador remoto no colisiona
        }

        const label = scene.current?.add.text(
          newPlayer?.x || playerData?.position.x,
          (newPlayer?.y || playerData?.position.y) - 40,
          playerData?.user.name || "Guest",
          {
            fontSize: "12px",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: { x: 5, y: 2 },
          }
        );
        label?.setOrigin(0.5, 0.5);
        playersUsernames.current[id] = label!;
        playersRefs.current[id] = newPlayer!;
      } else {
        const existingPlayer = playersRefs.current[id];

        if (existingPlayer.anims?.currentAnim?.key !== playerData.animation) {
          existingPlayer.anims.play(playerData.animation || "idle-down", true);
        }
      }

      if (playerData?.emote) {
        const existingPlayer = playersRefs.current[id];
        existingPlayer.anims.play(playerData.emote || "idle-down", true);

        existingPlayer.on(
          "animationcomplete",
          (animation: Phaser.Animations.Animation) => {
            if (animation.key === playerData.emote) {
              existingPlayer?.anims.play(`idle-down` as const, true);
            }
          }
        );
      }
    });

    // 2. Limpiar jugadores desconectados de la escena
    const currentPlayerIds = Object.keys(players);
    const scenePlayerIds = Object.keys(playersRefs.current);

    // Encontrar jugadores que están en la escena pero ya no en players
    const playersToRemove = scenePlayerIds.filter(
      (id) => !currentPlayerIds.includes(id)
    );

    // Remover jugadores desconectados de la escena
    playersToRemove.forEach((playerId) => {
      console.log("Removiendo jugador de la escena:", playerId);

      // Destruir el sprite del jugador
      if (playersRefs.current[playerId]) {
        playersRefs.current[playerId].destroy();
        delete playersRefs.current[playerId];
      }

      // Destruir el texto del nombre
      if (playersUsernames.current[playerId]) {
        playersUsernames.current[playerId].destroy();
        delete playersUsernames.current[playerId];
      }

      // Limpiar estado de interpolación
      delete remotePlayerStates.current[playerId];
      delete remotePlayersDepth.current[playerId];
    });
  }, [players, userId]);

  // Función auxiliar para interpolar jugadores remotos (evita duplicación)
  const interpolateRemotePlayers = () => {
    // Alinear la interpolación con el throttle (~150ms) para suavidad
    const INTERPOLATION_DURATION = 140;
    const now = Date.now();

    for (const id in playersRefs.current) {
      if (id === userIdString.current) continue;

      const sprite = playersRefs.current[id];
      const state = remotePlayerStates.current[id];

      if (sprite && state) {
        const t = Math.min(
          (now - state.lastUpdate) / INTERPOLATION_DURATION,
          1
        );

        // Interpolación manual (más eficiente que Phaser.Math.Interpolation.Linear)
        sprite.x = state.prev.x + (state.next.x - state.prev.x) * t;
        sprite.y = state.prev.y + (state.next.y - state.prev.y) * t;

        // Si completó la interpolación, asegurar posición exacta objetivo
        if (t >= 1) {
          sprite.x = state.next.x;
          sprite.y = state.next.y;
        }

        playersUsernames.current[id].setPosition(sprite.x, sprite.y - 40);

        // Optimizar depth: solo actualizar si cambia significativamente
        const newDepth = Math.floor(sprite.y);
        if (Math.abs((remotePlayersDepth.current[id] || 0) - newDepth) >= 1) {
          sprite.setDepth(newDepth);
          remotePlayersDepth.current[id] = newDepth;
        }
      }
    }
  };

  useEffect(() => {
    const initGame = async () => {
      // Verificar que el contenedor existe antes de inicializar
      const container = document.getElementById("game-container");
      if (!container) {
        setTimeout(initGame, 100);
        return;
      }

      const Phaser = await import("phaser");

      function preload(this: Phaser.Scene) {
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
        Object.keys(animationsConfig).forEach((animationKey) => {
          this.load.spritesheet(
            animationKey,
            `assets/characters/${userAvatarRef.current}/${animationKey}.png`,
            {
              frameWidth: 64,
              frameHeight: 64,
            }
          );
        });
      }

      function create(this: Phaser.Scene) {
        scene.current = this;

        // Creación del mapa
        const map = this.make.tilemap({ key: "tilemap" });
        // Cargar los tilesets según el nombre en el JSON
        const tilesetAtlas = map.addTilesetImage("tileset_1", "atlas_48x");
        const tilesetInteriors = map.addTilesetImage("tileset_2", "interiors");
        const tilesetRoomBuilder = map.addTilesetImage(
          "tileset_3",
          "room_builder"
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
          0
        )!;
        const furnitureLayer = map.createLayer("furniture", tilesets, 0, 0)!;
        const tablesLayer = map.createLayer("tables", tilesets, 0, 0)!;
        const upperFlowersLayer = map.createLayer(
          "upperFlowers",
          tilesets,
          0,
          0
        )!;
        map.createLayer("ornaments", tilesets, 0, 0);
        const doorsLayer = map.createLayer("doors", tilesets, 0, 0)!;
        const othersLayer = map.createLayer("others", tilesets, 0, 0)!;
        const upperPcLayer = map.createLayer("upperPc", tilesets, 0, 0)!;
        const abovePlayerLayer = map.createLayer(
          "Above Player",
          tilesets,
          0,
          0
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
        player.current = this.matter.add.sprite(960, 994, "walk");

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
          user?.username || "Guest",
          {
            fontSize: "12px",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: { x: 5, y: 2 },
          }
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

        Object.entries(animationsConfig).forEach(
          ([animationKey, animations]) => {
            animations.forEach((animation) => {
              const { key, start, end } = animation;
              const idleFrame =
                "idleFrame" in animation ? animation.idleFrame : undefined;

              const repeat = "repeat" in animation ? animation.repeat : -1;
              if (idleFrame) {
                // Animación idle
                this.anims.create({
                  key,
                  frames: [{ key: animationKey, frame: idleFrame }],
                  frameRate: 10,
                  repeat,
                });
              }
              // Animación de movimiento
              this.anims.create({
                key,
                frames: this.anims.generateFrameNumbers(animationKey, {
                  start,
                  end,
                }),
                frameRate: 10,
                repeat,
              });
            });
          }
        );

        // Ver si la animacion se detuvo
        player.current.on(
          "animationcomplete",
          (animation: Phaser.Animations.Animation) => {
            if (animation.key === emoteRef.current) {
              emoteRef.current = null;
              setEmote(null);
              player.current?.anims.play(
                `idle-${lastFacing.current}` as const,
                true
              );
            }
          }
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
        if (emoteRef.current && player.current) {
          player.current?.setVelocity(0, 0);
          const currentAnim = player.current?.anims.currentAnim?.key;

          if (currentAnim !== emoteRef.current) {
            handlePlayerMove({
              position: {
                x: player.current.x,
                y: player.current.y,
              },
              user: {
                id: userId.toString(),
                name: user?.username || "Guest",
                profile_url: user?.profile_url || "default-avatar.png",
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
            true
          );

          // Actualizar posición del nombre de usuario del jugador
          playerUsername.current?.setPosition(
            player.current?.x || 0,
            (player.current?.y || 0) - 40
          );

          if (player.current) {
            player.current.setDepth(player.current.y);
          }

          // Continuar manejando la interpolación para otros jugadores
          interpolateRemotePlayers();
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
              true
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
          (player.current?.y || 0) - 40
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
        interpolateRemotePlayers();

        // Gate local de rate limiting + cambio de animación
        const nowTs = performance.now();
        const canSendByTime =
          nowTs - lastBroadcastRef.current >= LOCAL_BROADCAST_MS;
        const currentAnimKey = player.current?.anims.currentAnim?.key;
        const hasAnimChanged = currentAnimKey !== lastSentRef.current.animation;

        // Detectar si está en movimiento (para decidir envío periódico)
        const isMoving = Math.abs(velocityX) > 0 || Math.abs(velocityY) > 0;

        // Enviar si:
        // - Cambió la animación (ej. mover->idle o idle->mover)
        // - O está moviéndose y ya pasó el intervalo local
        if (player.current && (hasAnimChanged || (isMoving && canSendByTime))) {
          handlePlayerMove({
            position: {
              x: player.current.x,
              y: player.current.y,
            },
            user: {
              id: userId.toString(),
              name: user?.username || "Guest",
              profile_url: user?.profile_url || "default-avatar.png",
            },
            animation: currentAnimKey,
          });

          lastBroadcastRef.current = nowTs;
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
    };
  }, [handlePlayerMove, user?.username, user?.profile_url, userId]);

  // Listeners para manejar el estado de input focus
  useEffect(() => {
    const isInputElement = (target: HTMLElement) =>
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.contentEditable === "true";

    // Habilita o deshabilita el manejo de teclado de Phaser
    const togglePhaserKeyboard = (enabled: boolean) => {
      if (scene.current?.input?.keyboard) {
        scene.current.input.keyboard.manager.enabled = enabled;
      }
    };

    // Listener para cuando se enfoca un input
    const handleFocusIn = (event: FocusEvent) => {
      if (isInputElement(event.target as HTMLElement)) {
        isInputFocusedRef.current = true;
        togglePhaserKeyboard(false);
      }
    };

    // Listener para cuando se desenfoca un input
    const handleFocusOut = () => {
      setTimeout(() => {
        const activeElement = document.activeElement as HTMLElement;
        const inputFocused = activeElement && isInputElement(activeElement);
        isInputFocusedRef.current = !!inputFocused;
        togglePhaserKeyboard(!inputFocused);
      }, 10);
    };

    // Listener para click en el canvas
    const handleCanvasClick = (event: MouseEvent) => {
      if ((event.target as HTMLElement).tagName === "CANVAS") {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && isInputElement(activeElement)) {
          activeElement.blur();
        }
      }
    };

    document.addEventListener("focusin", handleFocusIn, true);
    document.addEventListener("focusout", handleFocusOut, true);
    document
      .getElementById("game-container")
      ?.addEventListener("click", handleCanvasClick);

    return () => {
      document.removeEventListener("focusin", handleFocusIn, true);
      document.removeEventListener("focusout", handleFocusOut, true);
      document
        .getElementById("game-container")
        ?.removeEventListener("click", handleCanvasClick);
    };
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
