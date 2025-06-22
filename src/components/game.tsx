"use client";

import { useEffect, useRef } from "react";

type ObjectColliderType =
  | Phaser.Types.Physics.Arcade.GameObjectWithBody
  | Phaser.Physics.Arcade.Body
  | Phaser.Physics.Arcade.StaticBody
  | Phaser.Tilemaps.Tile;

export const Game = () => {
  const gameContainer = useRef<Phaser.Game | null>(null);
  const player =
    useRef<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null>(null);

  useEffect(() => {
    const initGame = async () => {
      const Phaser = await import("phaser");
      function preload(this: Phaser.Scene) {
        this.load.image("tiles", "assets/atlas_48x.png");
        this.load.tilemapTiledJSON("tilemap", "assets/tilemap.json");
        this.load.spritesheet("sofia", "assets/characters/sofia.png", {
          frameWidth: 64,
          frameHeight: 64,
        });
      }

      function create(this: Phaser.Scene) {
        // Creación del mapa
        const map = this.make.tilemap({ key: "tilemap" });
        const tileset = map.addTilesetImage("tileset", "tiles")!;

        // Creación de las capas del mapa
        const belowLayer = map.createLayer("Below Player", tileset, 0, 0)!;
        const carpetsLayer = map.createLayer("Carpets", tileset, 0, 0);
        const wallLayer = map.createLayer("Wall", tileset, 0, 0)!;
        const furnitureLayer = map.createLayer("Furniture", tileset, 0, 0)!;
        const tablesLayer = map.createLayer("Tables", tileset, 0, 0)!;
        const borderLayer = map.createLayer("Border", tileset, 0, 0)!;

        belowLayer?.setCollisionByProperty({ collides: false });
        wallLayer?.setCollisionByProperty({ collides: true });
        furnitureLayer?.setCollisionByProperty({ collides: true });
        tablesLayer?.setCollisionByProperty({ collides: true });
        borderLayer?.setCollisionByProperty({ collides: true });

        // const debugGraphics = this.add.graphics().setAlpha(0.75);
        // tablesLayer?.renderDebug(debugGraphics, {
        //   tileColor: null, // Color of non-colliding tiles
        //   collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
        //   faceColor: new Phaser.Display.Color(40, 39, 37, 255), // Color of colliding face edges
        // });

        // Creación del jugador
        player.current = this.physics.add.sprite(100, 450, "sofia");
        player.current.setSize(30, 60);

        const aboveLayer = map.createLayer("Above Player", tileset, 0, 0);

        const camera = this.cameras.main;
        camera.setZoom(1.5);
        camera.startFollow(player.current, true, 0.1, 0.1);

        this.physics.add.collider(player.current, tablesLayer);
        this.physics.add.collider(player.current, wallLayer);
        this.physics.add.collider(player.current, borderLayer);
        this.physics.add.collider(player.current, belowLayer);

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

        // Colisiones
        // this.physics.add.collider(player.current, platforms);
      }

      function update(this: Phaser.Scene) {
        const cursors = this.input.keyboard?.createCursorKeys();

        if (cursors?.left.isDown) {
          player.current?.setVelocityX(-160);
          player.current?.anims.play("left", true);
        } else if (cursors?.right.isDown) {
          player.current?.setVelocityX(160);
          player.current?.anims.play("right", true);
        } else if (cursors?.down.isDown) {
          player.current?.setVelocityY(160);
          player.current?.anims.play("down", true);
        } else if (cursors?.up.isDown) {
          player.current?.setVelocityY(-160);
          player.current?.anims.play("up", true);
        } else {
          player.current?.setVelocityX(0);
          player.current?.setVelocityY(0);
          player.current?.anims.play("turn", true);
        }

        if (cursors?.up.isDown && player.current?.body.touching.down) {
          player.current?.setVelocityY(-330);
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        physics: {
          default: "arcade",
          arcade: {
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
