from __future__ import annotations

import json
import re
import sys
from pathlib import Path

KEY = re.compile(r"^([A-Za-z0-9_-]+):[ \t]*(.*)$")
ITEM = re.compile(r"^[ \t]+-[ \t]+(.*)$")

EXIT_PUBLIC = 0
EXIT_PRIVATE = 1
EXIT_ERROR = 2
EXIT_EMPTY_SHARED = 3


def header_lines(text: str) -> list[str]:
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return []
    for i, line in enumerate(lines[1:], 1):
        if line.strip() == "---":
            return lines[1:i]
    return []


def strip_comment(value: str) -> str:
    quote = ""
    for i, ch in enumerate(value):
        if quote:
            if ch == quote:
                quote = ""
        elif ch in "\"'":
            quote = ch
        elif ch == "#" and (i == 0 or value[i - 1] in " \t"):
            return value[:i].rstrip()
    return value.strip()


def unquote(item: str) -> str:
    item = item.strip()
    if len(item) >= 2 and item[0] == item[-1] and item[0] in "\"'":
        return item[1:-1]
    return item


def split_items(text: str) -> list[str]:
    return [unquote(p) for p in text.split(",") if unquote(p)]


def parse_frontmatter(text: str) -> dict[str, str | list[str]]:
    meta: dict[str, str | list[str]] = {}
    lines = header_lines(text)
    i = 0
    while i < len(lines):
        m = KEY.match(lines[i])
        i += 1
        if not m:
            continue
        key, value = m.group(1), strip_comment(m.group(2))
        if value:
            meta[key] = value
            continue
        items: list[str] = []
        while i < len(lines):
            im = ITEM.match(lines[i])
            if not im:
                break
            items.append(unquote(strip_comment(im.group(1))))
            i += 1
        meta[key] = [x for x in items if x] if items else ""
    return meta


def shared_targets(meta: dict[str, str | list[str]]) -> list[str] | None:
    if "shared" not in meta:
        return None
    value = meta["shared"]
    if isinstance(value, list):
        return value
    if value.startswith("["):
        if not value.endswith("]"):
            return []
        return split_items(value[1:-1])
    return split_items(value)


def targets_visibility(targets_file: Path, names: list[str]) -> int:
    try:
        targets = json.loads(targets_file.read_text())
        if not isinstance(targets, dict):
            return EXIT_ERROR
    except (OSError, ValueError):
        return EXIT_ERROR
    for name in names:
        entry = targets.get(name)
        if not isinstance(entry, dict) or entry.get("visibility", "public") == "public":
            return EXIT_PUBLIC
    return EXIT_PRIVATE


def main(argv: list[str]) -> int:
    if len(argv) == 2 and argv[0] == "shared":
        try:
            meta = parse_frontmatter(Path(argv[1]).read_text())
        except OSError as e:
            print(f"frontmatter: {e}", file=sys.stderr)
            return EXIT_ERROR
        targets = shared_targets(meta)
        if targets is None:
            return 0
        if not targets:
            print(f"frontmatter: empty or unparsable shared in {argv[1]}", file=sys.stderr)
            return EXIT_EMPTY_SHARED
        print("\n".join(targets))
        return 0
    if len(argv) >= 3 and argv[0] == "visibility":
        return targets_visibility(Path(argv[1]), argv[2:])
    print("usage: frontmatter.py shared SKILL.md | visibility TARGETS.json NAME...", file=sys.stderr)
    return EXIT_ERROR


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
