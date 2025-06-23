# ☕ CondorCoders Café Virtual

**Café Virtual** es un experimento en construcción que busca convertirse en un espacio de networking virtual, similar a [Gather Town](https://www.gather.town/), donde los miembros de una comunidad puedan interactuar a través de avatares, trabajar juntos en tiempo real y chatear.

---

## Funcionalidades Implementadas

Hasta el momento, hemos seguido varios ejemplos oficiales de Supabase, integrando estas funcionalidades:

### Autenticación

🔗 [https://supabase.com/ui/docs/nextjs/password-based-auth](https://supabase.com/ui/docs/nextjs/password-based-auth)

- Registro e inicio de sesión con correo electrónico y contraseña.
- Persistencia de sesión.

🎥 Míralo en Youtube -> [https://youtu.be/EvMYKrBaAJQ?si=bQwNfA0J9979Ilkr](https://youtu.be/EvMYKrBaAJQ?si=bQwNfA0J9979Ilkr)

### Cursores en Tiempo Real

🔗 [https://supabase.com/ui/docs/nextjs/realtime-cursor](https://supabase.com/ui/docs/nextjs/realtime-cursor)

- Seguimiento del movimiento del mouse para simular presencia de usuarios en un espacio compartido.

🎥 Míralo en Youtube -> [https://youtu.be/iJf1mjYBy8k?si=-Gnh4BgUoQiMW97K](https://youtu.be/iJf1mjYBy8k?si=-Gnh4BgUoQiMW97K)

### Chat en Tiempo Real

🔗 [https://supabase.com/ui/docs/nextjs/realtime-chat](https://supabase.com/ui/docs/nextjs/realtime-chat)

- Chat estilo "lobby" donde todos los usuarios pueden ver y enviar mensajes en tiempo real.
- Mensajes asociados al usuario autenticado.
- Guardamos los mensajes en la tabla de `messages`.

🎥 Míralo en Youtube -> [https://youtu.be/CIseskgH6tY?si=0mPEiJW1sESO19gs](https://youtu.be/CIseskgH6tY?si=0mPEiJW1sESO19gs)

## Phaser

### Tutorial

Empezamos instalando y haciendo el tutorial de phaser para familiarizarnos con el software.
🔗 [https://docs.phaser.io/phaser/getting-started/installation](https://docs.phaser.io/phaser/getting-started/installation)
🔗 [https://docs.phaser.io/phaser/getting-started/making-your-first-phaser-game](https://docs.phaser.io/phaser/getting-started/making-your-first-phaser-game)

### Creación de Mapa

Creamos un mapa con Tiled y recursos gratuitos para los assets.
🔗 [Tiled - Software para dibujar mapa](https://www.mapeditor.org/)
🔗 [Assets](https://itch.io/game-assets/tag-top-down)
🔗 [Los Assets que usamos](https://gif-superretroworld.itch.io/interior-pack)

### Añadimos colisiones

Seguimos la siguiente documentación para agregar colisiones
🔗 [Buscar "Tileset Editor"](https://medium.com/@michaelwesthadley/modular-game-worlds-in-phaser-3-tilemaps-1-958fc7e6bbd6)

### Creamos y añadimos un nuevo personaje

🔗 [Generador de Personaje](https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/#?body=Body_color_light&head=Human_male_light)
