#!/usr/bin/env python3
"""Inyecta el motor 2.0 (assets/engine2.css y assets/engine2.js) en offline/ y online/.
Es idempotente: la primera vez hace las ediciones estructurales (resolución dinámica y
marcado de la pantalla de juego); siempre reescribe el contenido de los bloques marcados.
Uso:  python3 tools/inject-engine.py
"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
css = (root / 'assets/engine2.css').read_text(encoding='utf-8')
js = (root / 'assets/engine2.js').read_text(encoding='utf-8')

SND = '''<button class="btn ghost sm snd2" id="gSnd" aria-pressed="true" aria-label="Sonido de personajes: activado"><svg class="ic off" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5l5 4v-13l-5 4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5"/></svg><svg class="ic on" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5l5 4v-13l-5 4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg></button>'''

NEW_GAME = '''<main id="game" class="screen">
  <div class="stage" id="stage">
    <canvas id="cv" width="960" height="720" role="img" aria-label="Escenario del juego: carrera de hot dogs con preguntas"></canvas>
    <div class="hud">
      <button class="btn ghost sm" id="gExit" aria-label="Salir de la carrera"><svg class="ic" aria-hidden="true"><use href="#i-exit"/></svg><span class="gx">Salir</span></button>
      <button class="btn ghost sm snd2" id="gSnd" aria-pressed="true" aria-label="Sonido de personajes: activado"><svg class="ic off" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5l5 4v-13l-5 4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5"/></svg><svg class="ic on" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5l5 4v-13l-5 4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg></button>
      <span class="pill" id="gLvl">Nivel 1</span>
      <span class="pill" id="gScore" aria-live="off">0 pts</span>
    </div>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>
%(overlays)s
    <div class="ctrls">
      <button class="cbtn" id="cL" aria-label="Izquierda"><svg class="ic" aria-hidden="true"><use href="#i-left"/></svg></button>
      <button class="cbtn" id="cR" aria-label="Derecha"><svg class="ic" aria-hidden="true"><use href="#i-right"/></svg></button>
      <button class="cbtn j" id="cJ"><svg class="ic" aria-hidden="true"><use href="#i-up"/></svg>SALTAR</button>
    </div>
    <p class="keys">Teclado: flechas o A/D para moverte, espacio para saltar (otra vez en el aire = doble salto), 1–4 para responder.</p>
  </div>
  <div class="rot" id="rotHint" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.6"/><path d="M11 18.5h2"/></svg><span>Gira el teléfono para ver más del mundo</span></div>
</main>'''

for page in ['offline/index.html', 'online/index.html']:
    p = root / page
    s = p.read_text(encoding='utf-8')
    # 1) resolución lógica dinámica (una sola vez)
    old = "const W=960,H=540;cv.width=W*DPR;cv.height=H*DPR;"
    if old in s:
        s = s.replace(old, "let W=960,H=720,OX=0,OY=180,K=1;")
    assert 'let W=960,H=720' in s, page
    # 2) marcado de la pantalla de juego (una sola vez)
    if 'class="hud"' not in s:
        m = re.search(r'<main id="game" class="screen">.*?</main>', s, re.S)
        assert m, page
        blk = m.group(0)
        ov = re.findall(r'^    <div class="overlay" id="(?:qOv|rOv)".*$', blk, re.M)
        assert len(ov) == 2, (page, len(ov))
        s = s[:m.start()] + NEW_GAME % {'overlays': '\n'.join(ov)} + s[m.end():]
    if 'id="gSnd"' not in s:
        s = s.replace('<span class="gx">Salir</span></button>\n', '<span class="gx">Salir</span></button>\n      ' + SND + '\n', 1)
        assert 'id="gSnd"' in s, page
    if 'id="rotHint"' not in s:
        s = re.sub(r'(<main id="game" class="screen">.*?)(</main>)', lambda m: m.group(1) + '  <div class="rot" id="rotHint" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.6"/><path d="M11 18.5h2"/></svg><span>Gira el teléfono para ver más del mundo</span></div>\n' + m.group(2), s, count=1, flags=re.S)
    # 3) CSS
    if '<style id="engine2-css">' not in s:
        s = s.replace('</head>', '<style id="engine2-css"></style>\n</head>', 1)
    s, n = re.subn(r'<style id="engine2-css">.*?</style>', lambda m: '<style id="engine2-css">\n' + css + '</style>', s, flags=re.S)
    assert n == 1
    # 4) JS dentro del cierre, antes de arrancar
    block = '/*ENGINE2-START*/\n' + js + '\n/*ENGINE2-END*/\n'
    if '/*ENGINE2-START*/' in s:
        s = re.sub(r'/\*ENGINE2-START\*/.*?/\*ENGINE2-END\*/\n', lambda m: block, s, flags=re.S)
    else:
        m = re.search(r'^refreshHome\(\);(?:checkWarn\(\);)?\nif\(window\.BerryFx\)', s, re.M)
        assert m, page
        s = s[:m.start()] + block + s[m.start():]
    p.write_text(s, encoding='utf-8')
    print('ok', page, len(s))
