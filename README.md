# Hotdog Run 🌭

Carrera educativa: corre, salta y responde preguntas de la clase.

| Carpeta | Qué es |
|---|---|
| `index.html` | Selector Online / Offline |
| `offline/` | Un dispositivo, sin internet (archivo único con fuente incrustada + service worker) |
| `online/` | Salas con código, todos a la vez, con Supabase (ver `online/README.md`) |
| `assets/` | Fuentes y **fuentes únicas** del fondo animado (`ambient.*`) y del motor 2.0 (`engine2.*`) |
| `tools/` | Inyectores que copian `assets/` dentro de las tres páginas |

## Motor 2.0 (`assets/engine2.js`)

- **Viewport dinámico**: el escenario ocupa ~99 % de la pantalla; el mundo lógico se adapta al aspecto (≥ 960 de ancho y hasta 720 de alto), así que se ve *más mundo*, no solo más píxeles. Resolución interna adaptativa según los fps.
- **Cámara** con anticipación; **5 escenarios** (verde, atardecer, ciudad, cielo, noche) con parallax y detalles animados.
- **Personajes**: hot dogs (salchicha de color + pan normal/tostado/sin pan + 12 accesorios: gorra, sombreros, bigote, lentes, Spiderman, Batman, rockero, completo chileno…); estiramiento/aplastamiento, respiración, parpadeo, celebración y accesorios con movimiento secundario (solo visual: los hitboxes no cambian).
- **Física, preguntas, puntajes y red no se tocan**: el motor *envuelve* `step`, `answer`, etc.

Tras editar `assets/*`, ejecuta:

```bash
python3 tools/inject-ambient.py   # fondo vivo del menú y portadas
python3 tools/inject-engine.py    # motor 2.0 en offline/ y online/
```
