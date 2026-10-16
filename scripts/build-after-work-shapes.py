#!/usr/bin/env python3
"""Rebuild assets/data/after-work-shapes.json, the 96-column outline masks the spacing check uses.

Run after adding or changing a sticker in _includes/after-work/images/ (needs Pillow):
    python3 scripts/build-after-work-shapes.py
A cell is set when any pixel inside it is visible (alpha > 24), so the mask errs on the safe side.
"""
import base64, io, json, pathlib, re
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ['camera', 'tennis-ball', 'headphones', 'laptop', 'tablet', 'monstera', 'pothos', 'sparkles',
          'loop-arrow', 'shooting-star', 'avatar-cutout', 'coffee-cutout', 'cooking-cutout']
COLS, ALPHA = 96, 24

def mask(name):
    uri = (ROOT / '_includes/after-work/images' / f'{name}.html').read_text().strip()
    img = Image.open(io.BytesIO(base64.b64decode(re.sub(r'^data:[^,]+,', '', uri)))).convert('RGBA')
    w, h = img.size
    rows = max(1, round(COLS * h / w))
    alpha = img.getchannel('A').point(lambda a: 255 if a > ALPHA else 0)
    cells = alpha.resize((COLS, rows), Image.BOX).point(lambda a: 1 if a > 0 else 0)
    bits = ''.join(str(v) for v in cells.tobytes())
    bits += '0' * (-len(bits) % 8)
    data = bytes(int(bits[i:i + 8], 2) for i in range(0, len(bits), 8))
    return {'w': w, 'h': h, 'cols': COLS, 'rows': rows, 'bits': base64.b64encode(data).decode()}

out = {n: mask(n) for n in ASSETS}
(ROOT / 'assets/data/after-work-shapes.json').write_text(json.dumps(out, separators=(',', ':')) + '\n')
print('wrote', len(out), 'masks')
