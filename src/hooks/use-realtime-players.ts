import { useOnlineUsers } from "@/context/online-users-context";
import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook personalizado para manejar jugadores en tiempo real usando Supabase
 * Combina broadcast (para movimientos) y presence (para conexiones/desconexiones)
 */
// Función throttle: limita la frecuencia de llamadas a una función
// Solo ejecuta el callback si ha pasado el tiempo de delay especificado
const useThrottleCallback = <Params extends unknown[], Return>(
  callback: (...args: Params) => Return,
  delay: number
) => {
  const lastCall = useRef(0);
  const timeout = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Params) => {
      const now = Date.now();
      const remainingTime = delay - (now - lastCall.current);

      if (remainingTime <= 0) {
        if (timeout.current) {
          clearTimeout(timeout.current);
          timeout.current = null;
        }
        lastCall.current = now;
        callback(...args);
      } else if (!timeout.current) {
        timeout.current = setTimeout(() => {
          lastCall.current = Date.now();
          timeout.current = null;
          callback(...args);
        }, remainingTime);
      }
    },
    [callback, delay]
  );
};

const supabase = createClient();

// Genera un color aleatorio en formato HSL para cada usuario
const generateRandomColor = () =>
  `hsl(${Math.floor(Math.random() * 360)}, 100%, 70%)`;

export const generateRandomNumber = () => Math.floor(Math.random() * 100);

// Nombre del evento para los movimientos de jugadores
const EVENT_NAME = "realtime-player-move";

// Interfaz para definir la estructura básica de un jugador
interface Player {
  position: {
    x: number;
    y: number;
  };
  user: {
    id: string;
    name: string;
    profile_url?: string;
  };
  animation?: string;
  color?: string;
}

// Extiende Player agregando timestamp para eventos de movimiento
interface PlayerEventPayload extends Player {
  timestamp: number;
}

// Estructura de datos para el estado de presencia (usuarios conectados)
export interface PresenceState {
  user_id: string;
  username: string;
  online_at: string;
  profile_url?: string;
}

export const useRealtimePlayers = ({
  roomName,
  username,
  userId,
  throttleMs,
  profile_url,
}: {
  roomName: string;
  userId: string;
  username: string;
  throttleMs: number;
  profile_url: string;
}) => {
  // Color único para este usuario (se genera una sola vez)
  const [color] = useState(generateRandomColor());

  // Estado para almacenar las posiciones/movimientos de todos los jugadores
  const [players, setPlayers] = useState<Record<string, PlayerEventPayload>>(
    {}
  );

  // Estado para almacenar los usuarios conectados (presence)
  // const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceState>>(
  //   {}
  // );

  const { onlineUsers, setOnlineUsers } = useOnlineUsers();

  // Referencia al canal de Supabase para poder enviár mensajes
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Función que prepara y envía los datos del movimiento del jugador
  const callback = useCallback(
    (event: Player) => {
      const { position, user, animation } = event;

      // Construye el payload con toda la información del jugador
      const payload: PlayerEventPayload = {
        position: {
          x: position.x,
          y: position.y,
        },
        user: {
          id: user.id || userId,
          name: user.name || username,
          profile_url: user.profile_url || profile_url,
        },
        animation: animation,
        timestamp: new Date().getTime(), // Marca de tiempo para sincronización
      };

      // Envía el movimiento a través del canal usando broadcast
      channelRef.current?.send({
        type: "broadcast",
        event: EVENT_NAME,
        payload: payload,
      });
    },
    [userId, username, color, profile_url]
  );

  // Función throttled para manejar movimientos sin saturar la red
  const handlePlayerMove = useThrottleCallback(callback, throttleMs);

  useEffect(() => {
    // Crea un canal único para esta sala/habitación
    const channel = supabase.channel(roomName); // ej: "macrodata_refinement_office"
    channelRef.current = channel;

    channel
      // LISTENER 1: Escucha movimientos de otros jugadores via broadcast
      .on(
        "broadcast",
        { event: EVENT_NAME },
        (data: { payload: PlayerEventPayload }) => {
          const { user } = data.payload;
          // No renderizar tu propio jugador
          if (user.id === userId) return;

          setPlayers((prev) => {
            // Elimina tu propio jugador del estado (por si acaso)
            if (prev[userId]) {
              delete prev[userId];
            }

            // Agrega o actualiza la posición del otro jugador
            return {
              ...prev,
              [user.id]: data.payload,
            };
          });
        }
      )
      // LISTENER 2: Sincronización inicial de presence (usuarios conectados)
      .on("presence", { event: "sync" }, () => {
        // Obtiene el estado completo de todos los usuarios conectados
        const presenceState = channel.presenceState();
        console.log("Sincronización de presencia:", presenceState);

        // Convierte el estado de presence al formato que usamos
        const formattedUsers: Record<string, PresenceState> = {};
        Object.values(presenceState).forEach((presences) => {
          if (presences.length > 0) {
            const presence = presences[0] as unknown as PresenceState;
            formattedUsers[presence.user_id] = presence;
          }
        });

        setOnlineUsers(formattedUsers);
      })
      // LISTENER 3: Cuando un nuevo usuario se conecta
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("Usuario se conectó:", key, newPresences);

        if (newPresences.length > 0) {
          const presence = newPresences[0] as unknown as PresenceState;

          // No agregar tu propio usuario
          if (presence.user_id === userId) return;

          // Agregar a la lista de usuarios conectados
          setOnlineUsers((prev) => ({
            ...prev,
            [newPresences[0].user_id]: presence,
          }));

          // También agregar al estado de players con una posición inicial
          setPlayers((prev) => ({
            ...prev,
            [presence.user_id]: {
              position: {
                x: 960, // Posición inicial por defecto
                y: 994,
              },
              user: {
                id: presence.user_id,
                name: presence.username,
                profile_url: presence.profile_url || "default-avatar.png",
              },
              animation: "turn",
              timestamp: new Date().getTime(),
            },
          }));
        }
      })
      // LISTENER 4: Cuando un usuario se desconecta
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("Usuario se desconectó:", key, leftPresences);

        if (leftPresences.length > 0) {
          const leftPresence = leftPresences[0] as unknown as PresenceState;

          // No procesar tu propia desconexión (aunque no debería pasar)
          if (leftPresence.user_id === userId) return;

          // Elimina el usuario de la lista de conectados
          setOnlineUsers((prev) => {
            const updated = { ...prev };
            delete updated[leftPresence.user_id];
            return updated;
          });

          // También elimina al jugador del mapa cuando se desconecta
          setPlayers((prev) => {
            const updated = { ...prev };
            delete updated[leftPresence.user_id];
            return updated;
          });
        }
      })
      // Se suscribe al canal y cuando esté listo, trackea la presencia
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Registra la presencia del usuario actual en el canal
          await channel.track({
            user_id: userId,
            username: username,
            online_at: new Date().toISOString(),
            profile_url: profile_url,
          });
        }
      });

    return () => {
      // Limpieza: desuscribirse del canal
      // Supabase automáticamente hace untrack() de la presencia
      channel.unsubscribe();
    };
  }, [roomName, userId, username]);

  return {
    players, // Posiciones actuales de todos los jugadores
    onlineUsers, // Lista de usuarios conectados con su info de presencia
    handlePlayerMove, // Función para enviar movimientos (con throttle)
  };
};
