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
  const score = useRef(0);
  const scoreText = useRef<Phaser.GameObjects.Text | null>(null);
  const gameOver = useRef(false);
  const stars = useRef<Phaser.Physics.Arcade.Group | null>(null);
  const bombs = useRef<Phaser.Physics.Arcade.Group | null>(null);

  const collectStar = (_: ObjectColliderType, star: ObjectColliderType) => {
    (star as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody)?.disableBody(
      true,
      true
    );

    score.current += 10;
    scoreText?.current?.setText(`Score: ${score.current}`);

    if (stars.current && stars.current.countActive(true) === 0) {
      stars.current.children.iterate((child) => {
        const sprite =
          child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
        sprite.enableBody(true, sprite.x, 0, true, true);
        return null;
      });

      const x =
        (player.current?.x ?? 0) < 400
          ? Phaser.Math.Between(400, 800)
          : Phaser.Math.Between(0, 400);

      const bomb = bombs.current?.create(x, 16, "bomb");
      bomb?.setBounce(1);
      bomb?.setCollideWorldBounds(true);
      bomb?.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
  };

  const hitBomb = () => {
    player.current?.setTint(0xff0000);
    player.current?.anims.play("turn");
    gameOver.current = true;
  };
  useEffect(() => {
    const initGame = async () => {
      const Phaser = await import("phaser");
      function preload(this: Phaser.Scene) {
        this.load.image("sky", "assets/sky.png");
        this.load.image("ground", "assets/platform.png");
        this.load.image("star", "assets/star.png");
        this.load.image("bomb", "assets/bomb.png");
        this.load.spritesheet("dude", "assets/dude.png", {
          frameWidth: 32,
          frameHeight: 48,
        });
      }

      function create(this: Phaser.Scene) {
        // Fondo
        this.add.image(400, 300, "sky");

        // Plataformas
        const platforms = this.physics.add.staticGroup();
        platforms.create(400, 568, "ground").setScale(2).refreshBody(); // Suelo

        platforms.create(600, 400, "ground");
        platforms.create(50, 250, "ground");
        platforms.create(750, 220, "ground");

        // Creación del jugador
        player.current = this.physics.add.sprite(100, 450, "dude");
        player.current.setBounce(0.2);
        player.current.setCollideWorldBounds(true);

        // Animaciones del jugador
        this.anims.create({
          key: "left",
          frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
          frameRate: 10,
          repeat: -1,
        });

        this.anims.create({
          key: "right",
          frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
          frameRate: 10,
          repeat: -1,
        });

        this.anims.create({
          key: "turn",
          frames: [{ key: "dude", frame: 4 }],
          frameRate: 10,
          repeat: -1,
        });

        // Estrellas
        stars.current = this.physics.add.group({
          key: "star",
          repeat: 11,
          setXY: { x: 12, y: 0, stepX: 70 },
        });

        stars.current.children.iterate((star) => {
          (
            star as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
          ).setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)); // Ver documentacion para typescript
          return null;
        });

        // Colisiones
        this.physics.add.collider(player.current, platforms);
        this.physics.add.collider(stars.current, platforms);
        this.physics.add.overlap(
          player.current,
          stars.current,
          collectStar,
          undefined,
          this
        );

        // Texto
        scoreText.current = this.add.text(16, 16, "score:0", {
          fontSize: "32px",
          color: "#000",
        });

        // Bombas
        bombs.current = this.physics.add.group();
        this.physics.add.collider(bombs.current, platforms);
        this.physics.add.collider(
          player.current,
          bombs.current,
          hitBomb,
          undefined,
          this
        );
      }

      function update(this: Phaser.Scene) {
        if (gameOver.current) {
          return;
        }

        const cursors = this.input.keyboard?.createCursorKeys();

        if (cursors?.left.isDown) {
          player.current?.setVelocityX(-160);
          player.current?.anims.play("left", true);
        } else if (cursors?.right.isDown) {
          player.current?.setVelocityX(160);
          player.current?.anims.play("right", true);
        } else {
          player.current?.setVelocityX(0);
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
            gravity: { y: 300, x: 0 },
            debug: false,
          },
        },
        parent: "game-container",
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

  return <div id="game-container"></div>;
};
