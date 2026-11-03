#!/bin/bash
# Exporta la prueba a web/ y le agrega el botón para volver al juego.
# Uso: GODOT=/ruta/a/Godot_v4.3-stable_linux.x86_64 ./exportar.sh
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p web
"${GODOT:?indica la ruta de Godot 4.3 en GODOT}" --headless --path . --export-release "Web" web/index.html
python3 - <<'PY'
p = 'web/index.html'
s = open(p, encoding='utf-8').read()
extra = '''
<div id="volver" style="position:fixed;left:calc(env(safe-area-inset-left,0px) + 6px);top:calc(env(safe-area-inset-top,0px) + 6px);z-index:10;display:flex;gap:6px;font:bold 12px system-ui,sans-serif">
  <span style="background:rgba(40,90,200,.9);color:#fff;border-radius:8px;padding:7px 10px">PRUEBA EN GODOT</span>
  <button type="button" onclick="var p=location.pathname,i=p.indexOf('/prueba/');location.replace(i>=0?p.slice(0,i+1):'../../')" style="font:bold 12px system-ui,sans-serif;border:0;border-radius:8px;padding:7px 10px;background:#ffd048;color:#2a1638">Volver al juego</button>
</div>
'''
if 'id="volver"' not in s:
    s = s.replace('<body>', '<body>' + extra, 1)
open(p, 'w', encoding='utf-8').write(s)
PY
echo "Listo: web/index.html"
