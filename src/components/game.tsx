"use client";

import {
  generateRandomNumber,
  useRealtimePlayers,
} from "@/hooks/use-realtime-players";
import { useEffect, useRef, useState } from "react";
import { LoadingScreen } from "./loading-screen";

interface UserProfile {
  id: string;
  username: string;
  profile_url: string;
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
    throttleMs: 50,
  });

  // Referencia para acceder a players en Phaser sin recrear el juego
  const playersData = useRef(players);

  // Actualizar la referencia cuando cambien los players
  useEffect(() => {
    playersData.current = players;
  }, [players]);

  useEffect(() => {
    if (!gameContainer.current) return;

    // 1. Crear/actualizar jugadores existentes
    Object.entries(players).forEach(([id, playerData]) => {
      // Guardar posiciones previas y nuevas para **interpolación temporal**
      if (id !== userId.toString()) {
        if (!remotePlayerStates.current[id]) {
          remotePlayerStates.current[id] = {
            prev: { x: playerData?.position.x, y: playerData?.position.y },
            next: { x: playerData?.position.x, y: playerData?.position.y },
            lastUpdate: Date.now(),
          };
        } else {
          remotePlayerStates.current[id].prev = {
            ...remotePlayerStates.current[id].next,
          };
          remotePlayerStates.current[id].next = {
            x: playerData?.position.x,
            y: playerData?.position.y,
          };
          remotePlayerStates.current[id].lastUpdate = Date.now();
        }
      }
      if (!playersRefs.current[id]) {
        const newPlayer = scene.current?.matter.add.sprite(
          playerData?.position.x,
          playerData?.position.y,
          "sofia"
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
        if (id !== userId.toString()) {
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
          existingPlayer.anims.play(playerData.animation || "turn", true);
        }
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
    });
  }, [players, userId]);

  useEffect(() => {
    const initGame = async () => {
      // Verificar que el contenedor existe antes de inicializar
      const container = document.getElementById("game-container");
      if (!container) {
        setTimeout(initGame, 100);
        return;
      }

      const Phaser = await import("phaser");
      // const Matter = await import("matter-js");
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
        this.load.spritesheet("sofia", "assets/characters/sofia.png", {
          frameWidth: 64,
          frameHeight: 64,
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
        player.current = this.matter.add.sprite(960, 994, "sofia");

        player.current.setBody({
          type: "rectangle",
          width: 28, // 32
          height: 45, // 48
        });
        player.current.setFixedRotation();
        player.current.setOrigin(0.5, 0.6);
        player.current.setBounce(0); // CAMBIO: Sin rebote para el jugador local
        player.current.setFriction(0.1, 0.1, 0.1); // CAMBIO: Baja fricción para el jugador local

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
        const topLayersDepth = 10000;
        upperFlowersLayer.setDepth(topLayersDepth);
        upperPcLayer.setDepth(topLayersDepth);
        abovePlayerLayer?.setDepth(topLayersDepth);
        doorsLayer.setDepth(topLayersDepth);

        const camera = this.cameras.main;
        camera.setZoom(1.5);
        camera.startFollow(player.current, true, 0.1, 0.1);
        camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // Animaciones del jugador
        this.anims.create({
          key: "up",
          frames: this.anims.generateFrameNumbers("sofia", {
            start: 0,
            end: 8,
          }),
          frameRate: 10,
          repeat: -1,
        });
        this.anims.create({
          key: "left",
          frames: this.anims.generateFrameNumbers("sofia", {
            start: 9,
            end: 17,
          }),
          frameRate: 10,
          repeat: -1,
        });
        this.anims.create({
          key: "down",
          frames: this.anims.generateFrameNumbers("sofia", {
            start: 18,
            end: 26,
          }),
          frameRate: 10,
          repeat: -1,
        });

        this.anims.create({
          key: "right",
          frames: this.anims.generateFrameNumbers("sofia", {
            start: 27,
            end: 35,
          }),
          frameRate: 10,
          repeat: -1,
        });

        this.anims.create({
          key: "turn",
          frames: [{ key: "sofia", frame: 19 }],
          frameRate: 10,
          repeat: -1,
        });

        // Finalizar la carga
        setLoadingProgress(100);

        // Ocultar pantalla de carga después de una breve pausa
        setTimeout(() => {
          setIsLoading(false);
        }, 800);
      }

      function update(this: Phaser.Scene) {
        // Verifica si un input está enfocado
        if (isInputFocusedRef.current) {
          player.current?.setVelocity(0, 0);
          player.current?.anims.play("turn", true);

          // Actualizar posición del nombre de usuario del jugador
          playerUsername.current?.setPosition(
            player.current?.x || 0,
            (player.current?.y || 0) - 40
          );

          if (player.current) {
            player.current.setDepth(player.current.y);
          }

          // Continuar manejando la interpolación para otros jugadores
          const INTERPOLATION_DURATION = 50;
          Object.entries(playersRefs.current).forEach(([id, sprite]) => {
            if (id !== userId.toString()) {
              const state = remotePlayerStates.current[id];
              if (sprite && state) {
                const now = Date.now();
                const t = Math.min(
                  (now - state.lastUpdate) / INTERPOLATION_DURATION,
                  1
                );
                sprite.x = Phaser.Math.Interpolation.Linear(
                  [state.prev.x, state.next.x],
                  t
                );
                sprite.y = Phaser.Math.Interpolation.Linear(
                  [state.prev.y, state.next.y],
                  t
                );
                playersUsernames.current[id].setPosition(
                  sprite.x,
                  sprite.y - 40
                );
                sprite.setDepth(sprite.y);
              }
            }
          });
          return; // Salir temprano, no procesar controles del juego
        }

        // Controles del juego cuando no hay input activo
        const cursors = this.input.keyboard?.createCursorKeys();

        const speed = 2.7;
        let velocityX = 0;
        let velocityY = 0;

        if (cursors?.left.isDown) {
          velocityX = -speed;
          player.current?.anims.play("left", true);
        } else if (cursors?.right.isDown) {
          velocityX = speed;
          player.current?.anims.play("right", true);
        } else if (cursors?.down.isDown) {
          velocityY = speed;
          player.current?.anims.play("down", true);
        } else if (cursors?.up.isDown) {
          velocityY = -speed;
          player.current?.anims.play("up", true);
        } else {
          velocityX = 0;
          velocityY = 0;
          player.current?.anims.play("turn", true);
        }

        player.current?.setVelocity(velocityX, velocityY);
        playerUsername.current?.setPosition(
          player.current?.x || 0,
          (player.current?.y || 0) - 40
        );

        if (player.current) {
          player.current.setDepth(player.current.y);
        }

        // INTERPOLACIÓN TEMPORAL PARA JUGADORES REMOTOS
        const INTERPOLATION_DURATION = 50; // ms, igual al throttle del servidor
        Object.entries(playersRefs.current).forEach(([id, sprite]) => {
          if (id !== userId.toString()) {
            const state = remotePlayerStates.current[id];
            if (sprite && state) {
              // Verifica que sprite y state existan
              const now = Date.now();
              const t = Math.min(
                (now - state.lastUpdate) / INTERPOLATION_DURATION,
                1
              );
              sprite.x = Phaser.Math.Interpolation.Linear(
                [state.prev.x, state.next.x],
                t
              );
              sprite.y = Phaser.Math.Interpolation.Linear(
                [state.prev.y, state.next.y],
                t
              );
              playersUsernames.current[id].setPosition(sprite.x, sprite.y - 40);
              sprite.setDepth(sprite.y);
            }
          }
        });

        if (
          player.current?.x === playersData.current[userId]?.position.x &&
          player.current?.y === playersData.current[userId]?.position.y
        ) {
          return;
        }
        handlePlayerMove({
          position: {
            x: player.current?.x || 0,
            y: player.current?.y || 0,
          },
          user: {
            id: userId.toString(),
            name: user?.username || "Guest",
            profile_url: user?.profile_url || "default-avatar.png",
          },
          animation: player.current?.anims.currentAnim?.key,
        });
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        physics: {
          default: "matter",
          matter: {
            gravity: { y: 0, x: 0 },
            debug: true,
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
          preload: preload,
          create: create,
          update: update,
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
      if (gameContainer.current) {
        gameContainer.current.destroy(true);
        gameContainer.current = null;
      }
    };
  }, [handlePlayerMove, user?.username, userId]);

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
    <div className="relative min-h-dvh w-full">
      {/* Pantalla de carga */}
      {isLoading && <LoadingScreen loadingProgress={loadingProgress} />}

      {/* Container del juego */}
      <div
        id="game-container"
        className="min-h-dvh w-full"
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
