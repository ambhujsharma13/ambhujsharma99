#!/usr/bin/env python3
"""
One-off repair script: cleans NaN/Infinity out of already-generated data
files without needing to re-run the full (slow) fetch pipeline. Run this
once from the scripts/ folder:

    python fix_nan_data.py

Safe to delete after running — it's not part of the regular pipeline.
"""
import json
import math
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "web" / "public" / "data"


def sanitize(obj):
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    if isinstance(obj, dict):
        return {k: sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize(v) for v in obj]
    return obj


def main():
    fixed = 0
    for path in DATA_DIR.glob("*.json"):
        text = path.read_text(encoding="utf-8")
        # Python's json.loads actually accepts bare NaN by default (it's a
        # non-standard extension Python supports on the read side even
        # though it shouldn't write it) — so this can parse the broken
        # files just fine, then re-serialize them correctly.
        try:
            data = json.loads(text)
        except json.JSONDecodeError as e:
            print(f"  SKIP {path.name}: still couldn't parse ({e})")
            continue
        clean = sanitize(data)
        path.write_text(json.dumps(clean, indent=2), encoding="utf-8")
        fixed += 1
        print(f"  cleaned {path.name}")
    print(f"\nDone — cleaned {fixed} file(s).")


if __name__ == "__main__":
    main()
