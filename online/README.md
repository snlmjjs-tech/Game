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

## Límites y notas

- **Cupo del plan gratis de Supabase:** ~100 mensajes/s y 200 conexiones. `MSG_BUDGET` (90) reparte ese presupuesto entre los jugadores: con más alumnos, las posiciones se actualizan menos veces por segundo (el movimiento se interpola). Para clases grandes, un plan de pago permite subirlo.
- Los resultados y las respuestas correctas viajan al navegador (el juego corre en el cliente): un alumno técnico podría hacer trampa. Es adecuado para uso en clase, no para competencias con premios.
- No hay reconexión a mitad de nivel: si un alumno recarga, entra en el siguiente nivel.
