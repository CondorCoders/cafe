# ☕ CondorCoders Café Virtual

**Café Virtual** busca convertirse en un espacio de networking virtual, similar a [Gather Town](https://www.gather.town/), donde los miembros de la comunidad puedan interactuar a través de avatares, trabajar juntos en tiempo real y chatear.

---

## Para trabajar en el proyecto

Crea un proyecto en Supabase y agrega lo siguiente en un archivo `.env`

```.env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Funcionalidades Implementadas

### Autenticación

🔗 [https://supabase.com/docs/guides/auth/social-login/auth-twitch](https://supabase.com/docs/guides/auth/social-login/auth-twitch)

- Inicio de sesión con Twitch
- Persistencia de sesión.

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

### Usuarios en Tiempo Real

- implementamos `use-realtime-player` para cargar mas jugadores en tiempo real

### Onboarding

- `profile-form` con react hook y zod para actualizar indormación de perfil en la base de datos

### Youtube

🎥 NextJS + Supabase UI Authentication -> [https://youtu.be/EvMYKrBaAJQ?si=bQwNfA0J9979Ilkr](https://youtu.be/EvMYKrBaAJQ?si=bQwNfA0J9979Ilkr)
🎥 NextJS + Supabase Realtime -> [https://youtu.be/iJf1mjYBy8k?si=-Gnh4BgUoQiMW97K](https://youtu.be/iJf1mjYBy8k?si=-Gnh4BgUoQiMW97K)
🎥 Chat en tiempo real con Supabase UI -> [https://youtu.be/CIseskgH6tY?si=0mPEiJW1sESO19gs](https://youtu.be/CIseskgH6tY?si=0mPEiJW1sESO19gs)
