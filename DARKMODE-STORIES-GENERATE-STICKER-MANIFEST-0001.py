#!/usr/bin/env python3
"""Generate the sticker manifest from artwork beside this script."""

import json
import re
from pathlib import Path

root = Path(__file__).resolve().parent
manifest = root / "DARKMODE-STORIES-STICKER-MANIFEST-0001.json"
allowed = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}
pattern = re.compile(r"DARKMODE-STORIES-STICKER-(.+)-\d{4}")
existing = json.loads(manifest.read_text(encoding="utf-8")) if manifest.exists() else []
items = {
    item["src"]: item for item in existing
    if (root / item["src"]).is_file()
}

for file in sorted(root.iterdir()):
    match = pattern.fullmatch(file.stem)
    if file.is_file() and match and file.suffix.lower() in allowed:
        name = match[1].replace("-", " ").title()
        items.setdefault(file.name, {"name": name, "src": file.name})

manifest.write_text(json.dumps(list(items.values()), indent=2) + "\n", encoding="utf-8")
print(f"Generated {len(items)} stickers.")
