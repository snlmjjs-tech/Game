#!/usr/bin/env python3
"""Genera dist/: tres HTML autosuficientes listos para subir a cualquier hosting
(index.html = menú, offline.html, online.html) + un .zip + LEEME.txt.
Todo va incrustado (fuente, librería de Supabase, configuración): no necesitan carpetas.
Uso:  python3 tools/build-dist.py
"""
import re, base64, zipfile, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
dist = root / 'dist'
dist.mkdir(exist_ok=True)
font = 'data:font/woff2;base64,' + base64.b64encode((root / 'assets/fonts/bricolage-latin.woff2').read_bytes()).decode()

def rd(p): return (root / p).read_text(encoding='utf-8')

def drop_line(s, pat):
    s2, n = re.subn(pat, '', s, flags=re.M)
    return s2, n

# --- offline.html ---
s = rd('offline/index.html')
s, _ = drop_line(s, r'^<link rel="manifest"[^\n]*\n')
s, n = re.subn(r"if\('serviceWorker' in navigator[^\n]*\n", '', s)
assert n == 1
(dist / 'offline.html').write_text(s, encoding='utf-8')

# --- online.html ---
s = rd('online/index.html')
lib = rd('online/vendor/supabase.js')
assert '</script' not in lib
# El empaquetador de la librería calcula su ruta pública desde el <script src>; incrustada no existe.
# En el navegador esa ruta no se usa (solo carga un módulo de Node), así que se neutraliza.
PATCH_OLD = 'if(!e)throw new Error("Automatic publicPath is not supported in this browser");'
assert PATCH_OLD in lib
lib = lib.replace(PATCH_OLD, 'if(!e)e="/";')
s = s.replace('<script src="vendor/supabase.js"></script>', '<script>\n' + lib + '\n</script>')
s = s.replace('<script src="config.js"></script>', '<script>\n' + rd('online/config.js') + '\n</script>')
s = s.replace('url(../assets/fonts/bricolage-latin.woff2)', 'url(' + font + ')')
s, _ = drop_line(s, r'^<link rel="preload" href="\.\./assets/fonts/[^\n]*\n')
assert 'vendor/' not in s and '../assets' not in s
(dist / 'online.html').write_text(s, encoding='utf-8')

# --- index.html (menú) ---
s = rd('index.html')
s = s.replace('url(assets/fonts/bricolage-latin.woff2)', 'url(' + font + ')')
s, _ = drop_line(s, r'^<link rel="preload" href="assets/fonts/[^\n]*\n')
s = s.replace('href="online/"', 'href="online.html"').replace('href="offline/"', 'href="offline.html"')
assert 'assets/' not in s.replace('assets/ambient', '')
(dist / 'index.html').write_text(s, encoding='utf-8')

(dist / 'LEEME.txt').write_text("""HOTDOG RUN - archivos para subir a aulagame.cl
=============================================

Sube estos 3 archivos HTML a la MISMA carpeta de tu hosting (por ejemplo public_html):

  index.html    -> menu principal (elige Online u Offline)
  offline.html  -> juego sin internet
  online.html   -> juego en vivo con codigo de sala (usa Supabase)

No necesitas subir nada mas: la fuente, la libreria de Supabase y la configuracion
ya estan dentro de cada archivo.

Recomendaciones
- Usa HTTPS (candado) en aulagame.cl: algunos navegadores restringen el audio y el
  portapapeles en sitios sin HTTPS.
- La version online guarda las salas en tu proyecto de Supabase (la clave publica ya
  esta incluida). Si algun dia cambias de proyecto, edita SUPABASE_URL y
  SUPABASE_ANON_KEY dentro de online.html (buscalos con Ctrl+F).
- Si actualizas el juego, vuelve a subir los archivos y recarga con Ctrl+F5.
""", encoding='utf-8')

with zipfile.ZipFile(dist / 'hotdog-run-aulagame.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for f in ['index.html', 'offline.html', 'online.html', 'LEEME.txt']:
        z.write(dist / f, f)
for f in sorted(dist.iterdir()):
    print(f'{f.name:26s}{f.stat().st_size/1024:8.0f} KB')
