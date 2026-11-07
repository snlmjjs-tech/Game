#!/usr/bin/env python3
"""Inyecta assets/ambient.css y assets/ambient.js (inline) en las tres páginas.
Cada página tiene <style id="ambient-css"></style> y <script id="ambient-js"></script>;
este script rellena su contenido. Edita los archivos de assets/ y vuelve a ejecutarlo:
    python3 tools/inject-ambient.py
"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
css = (root / 'assets/ambient.css').read_text(encoding='utf-8')
js = (root / 'assets/ambient.js').read_text(encoding='utf-8')
for page in ['index.html', 'offline/index.html', 'online/index.html']:
    p = root / page
    s = p.read_text(encoding='utf-8')
    s, n1 = re.subn(r'<style id="ambient-css">.*?</style>', lambda m: '<style id="ambient-css">\n' + css + '</style>', s, flags=re.S)
    s, n2 = re.subn(r'<script id="ambient-js">.*?</script>', lambda m: '<script id="ambient-js">\n' + js + '</script>', s, flags=re.S)
    assert n1 == 1 and n2 == 1, f'{page}: faltan marcadores ({n1},{n2})'
    p.write_text(s, encoding='utf-8')
    print('ok', page)
