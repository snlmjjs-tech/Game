# Berry Run Online

Carrera en vivo para toda la clase: el profesor crea una sala, los estudiantes entran con un código de 6 números y todos juegan el mismo nivel a la vez (como Gimkit / Fall Guys).

## Puesta en marcha con Supabase (≈ 5 minutos)

1. Crea un proyecto en <https://supabase.com>.
2. **Authentication › Sign In / Providers** → activa **Allow anonymous sign-ins** (el navegador del profesor entra como usuario anónimo para ser dueño de su sala).
3. **SQL Editor** → pega y ejecuta [`supabase.sql`](./supabase.sql) (crea las tablas `rooms` y `results` con políticas RLS).
4. **Project Settings › API** → copia *Project URL* y la clave *anon public* en [`config.js`](./config.js).
5. Publica (GitHub Pages ya sirve `online/`). Listo.

Mientras `config.js` esté vacío, la página funciona en **modo demostración local**: sirve para probar con varias pestañas del mismo navegador, no entre dispositivos.

## Cómo se juega

- **Profesor:** `Soy profesor` → edita preguntas (mismo panel que offline) → `Crear sala online` → comparte el código o el enlace → `Iniciar partida`. Ve la clasificación en vivo, puede `Terminar nivel` y pasa al `Siguiente nivel`. Debe dejar su pestaña abierta: **su navegador hace de servidor de la sala**.
- **Estudiante:** escribe el código y su nombre, crea su avatar y `¡Entrar!`. Espera en la sala hasta que el profesor inicie.
- Cuando el primero llega a la meta, el resto tiene 20 s (`GRACE_SECONDS`). Los puntajes de cada nivel se guardan en la tabla `results`.

## Arquitectura

| Pieza | Para qué |
|---|---|
| `rooms` (Postgres) | código de sala + preguntas. Lectura pública; solo su profesor la modifica (RLS). |
| `results` (Postgres) | puntaje por jugador y nivel. Solo lo ve/escribe el profesor dueño. |
| Realtime Broadcast `berry:<código>:down` | profesor → todos: lista de jugadores, inicio de nivel, posiciones, resultados. |
| Realtime Broadcast `berry:<código>:up:<id>` | cada jugador → profesor: su posición (2–6 veces/s). |

Cada navegador simula su propio personaje (la física corre local) y el profesor reenvía las posiciones de todos para dibujar a los demás. Los niveles se generan con una semilla común, así que todos ven lo mismo.

## Cómo se ahorran mensajes

- **Predicción de movimiento:** cada jugador solo envía su posición cuando se aparta de lo que los demás ya predicen (por su velocidad), cambia de estado (salto, aturdido, meta…) o pasó ~1 s. Correr en línea recta casi no gasta mensajes.
- **Por cercanía:** si no hay nadie cerca (nadie lo ve), el umbral es mayor y envía mucho menos. Esto lo decide cada navegador con las posiciones que ya conoce.
- **Tope duro:** la predicción solo puede *reducir* envíos; nunca superan la parte del presupuesto (`MSG_BUDGET`) que le toca a cada jugador. Lo que se ahorra en subida se reasigna a la bajada (más actualizaciones de los demás).
- Medido en pruebas locales (jugadores simulados): total ≈ 84 mensajes/s con 30 jugadores y `MSG_BUDGET` 90; con 12 jugadores y presupuesto 40, ≈ 39.

## Límites y notas

- **Plan gratis de Supabase** ([documentación oficial](https://supabase.com/docs/guides/realtime/limits)): 200 conexiones y 100 mensajes/s; si se supera, Supabase **desconecta**. Por eso `MSG_BUDGET` (90) queda por debajo. Plan Pro: 500 conexiones y 500 mensajes/s (sube `MSG_BUDGET` a ~300–400).
- Los resultados y las respuestas correctas viajan al navegador (el juego corre en el cliente): un alumno técnico podría hacer trampa. Es adecuado para uso en clase, no para competencias con premios.
- No hay reconexión a mitad de nivel: si un alumno recarga, entra en el siguiente nivel.
