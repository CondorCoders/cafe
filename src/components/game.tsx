"use client";

import {
  generateRandomNumber,
  useRealtimePlayers,
} from "@/hooks/use-realtime-players";
import { useEffect, useRef, useState } from "react";

interface GameProps {
  userId?: string;
}

export const Game = ({ userId: dbUserId }: GameProps) => {
  const gameContainer = useRef<Phaser.Game | null>(null);
  const player = useRef<Phaser.Physics.Matter.Sprite | null>(null);
  const scene = useRef<Phaser.Scene | null>(null);
  const playersRefs = useRef<Record<string, Phaser.Physics.Matter.Sprite>>({});
  const [userId] = useState(dbUserId || generateRandomNumber());

  const { players, handlePlayerMove } = useRealtimePlayers({
    roomName: "virtual-cafe",
    userId: userId.toString(),
    username: `User_${userId}`,
    throttleMs: 100,
  });

  useEffect(() => {
    if (!gameContainer.current) return;

    Object.entries(players).forEach(([id, playerData]) => {
      if (!playersRefs.current[id]) {
        const newPlayer = scene.current?.matter.add.sprite(
          playerData.position.x,
          playerData.position.y,
          "sofia"
        );
        newPlayer?.setDepth(playerData.position.y);
        newPlayer?.setBody({
          type: "rectangle",
          width: 32,
          height: 48,
        });
        newPlayer?.setFixedRotation();
        newPlayer?.setOrigin(0.5, 0.6);
        playersRefs.current[id] = newPlayer!;
      } else {
        const existingPlayer = playersRefs.current[id];
        existingPlayer.setPosition(
          playerData.position.x,
          playerData.position.y
        );
        existingPlayer.setDepth(playerData.position.y);
        if (existingPlayer.anims.currentAnim?.key !== playerData.animation) {
          existingPlayer.anims.play(playerData.animation || "turn", true);
        }
      }
    });
  }, [players]);

  useEffect(() => {
    const initGame = async () => {
      const Phaser = await import("phaser");
      // const Matter = await import("matter-js");
      function preload(this: Phaser.Scene) {
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
        const tilesetRoomBuilder = map.addTilesetImage("tileset_3", "room_builder");
        // Puedes agregar más tilesets si tu tilemap.json los tiene
        // Agrupa todos los tilesets en un array y filtra los null
        const tilesets = [tilesetAtlas, tilesetInteriors, tilesetRoomBuilder].filter(Boolean) as Phaser.Tilemaps.Tileset[];

        // Creación de las capas del mapa
        map.createLayer("Below Player", tilesets, 0, 0);
        map.createLayer("floor", tilesets, 0, 0);
        map.createLayer("carpets", tilesets, 0, 0);
        const chairsLayer = map.createLayer("chairs", tilesets, 0, 0)!;
        const wallsLayer = map.createLayer("walls", tilesets, 0, 0)!;
        const lowerFlowersLayer = map.createLayer("lowerFlowers", tilesets, 0, 0)!;
        const furnitureLayer = map.createLayer("furniture", tilesets, 0, 0)!;
        const tablesLayer = map.createLayer("tables", tilesets, 0, 0)!;
        const upperFlowersLayer = map.createLayer("upperFlowers", tilesets, 0, 0)!;
        map.createLayer("ornaments", tilesets, 0, 0);
        const doorsLayer = map.createLayer("doors", tilesets, 0, 0)!;
        const othersLayer = map.createLayer("others", tilesets, 0, 0)!;
        const upperPcLayer = map.createLayer("upperPc", tilesets, 0, 0)!;
        const abovePlayerLayer = map.createLayer("Above Player", tilesets, 0, 0);

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

        // Establecer una profundidad alta para las capas que deben estar siempre por encima
        const topLayersDepth = 10000;
        upperFlowersLayer.setDepth(topLayersDepth);
        upperPcLayer.setDepth(topLayersDepth);
        abovePlayerLayer?.setDepth(topLayersDepth);
        doorsLayer.setDepth(topLayersDepth);

        const camera = this.cameras.main;
        camera.setZoom(1.5);
        camera.startFollow(player.current, true, 0.1, 0.1);

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
      }

      function update(this: Phaser.Scene) {
        const cursors = this.input.keyboard?.createCursorKeys();

        const speed = 3;
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

        if (player.current) {
          player.current.setDepth(player.current.y);
        }

        if (
          player.current?.x === players[userId]?.position.x &&
          player.current?.y === players[userId]?.position.y
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
            name: `User_${userId}`,
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
        scene: {
          preload: preload,
          create: create,
          update: update,
        },
      };
      gameContainer.current = new Phaser.Game(config);
    };

    initGame();
  }, []);

  return <div id="game-container" className="min-h-dvh w-full"></div>;
};
