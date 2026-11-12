#!/usr/bin/env python3
"""Embed screenshots into the progress page: python3 build-gallery.py plan.html shots.json
shots.json = [{"t": "title", "f": "path/to/shot.png", "c": "caption"}, ...]  (needs Pillow)
Rewrites the `const SHOTS=...;` line as small JPEG data URIs (keeps the page well under the 16 MB limit)."""
import base64, io, json, re, sys
from PIL import Image

page, manifest = sys.argv[1], sys.argv[2]
out = []
for it in json.load(open(manifest)):
    try:
        im = Image.open(it["f"]).convert("RGB")
    except Exception as e:
        print("skip", it["f"], e); continue
    im.thumbnail((360, 1000))
    b = io.BytesIO(); im.save(b, "JPEG", quality=70, optimize=True)
    out.append({"t": it["t"], "c": it.get("c", ""), "u": "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()})
s = open(page).read()
js = json.dumps(out, ensure_ascii=False).replace("\\", "\\\\")
s = re.sub(r"const SHOTS=.*?;\n", lambda m: "const SHOTS=" + js + ";\n", s, count=1, flags=re.S)
open(page, "w").write(s)
print(len(out), "images,", len(s) // 1024, "KB")
