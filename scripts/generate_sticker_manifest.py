#!/usr/bin/env python3
"""Generate assets/stickers/manifest.json from image files in the folder."""
from pathlib import Path
import json

folder = Path("assets/stickers")
allowed = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}
items = []

for file in sorted(folder.iterdir()):
    if file.is_file() and file.suffix.lower() in allowed:
        name = file.stem.replace("-", " ").replace("_", " ").title()
        items.append({
            "name": name,
            "src": f"assets/stickers/{file.name}"
        })

(folder / "manifest.json").write_text(
    json.dumps(items, indent=2) + "\n",
    encoding="utf-8"
)
print(f"Generated {len(items)} stickers.")
