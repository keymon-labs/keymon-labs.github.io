from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import NamedTuple

sys.path.insert(0, str(Path(__file__).resolve().parent))
from frontmatter import ITEM, header_lines  # noqa: E402


class Finding(NamedTuple):
    path: str
    line: int
    rule: str
    text: str


EMAIL = re.compile(r"[\w.+-]+@([\w-]+\.[\w.]+)")

RULES = [
    ("path", re.compile(r"/home/(?!alice\b)[\w.-]+|/Users/")),
    ("session-link", re.compile(r"Claude-Session|claude\.ai/code/session")),
    (
        "secret",
        re.compile(
            r"age1[a-z0-9]{20,}|\bsops\b|\.env\b|(ghp_|gho_|sk-|xox[bp]-)[A-Za-z0-9]{10,}"
        ),
    ),
    ("host", re.compile(r"\b\d{1,3}(?:\.\d{1,3}){3}\b")),
    ("outside-ref", re.compile(r"(?:\]\(|\]:\s*|<)\.\./|~/\.claude|~/git/|~/src/")),
]
DASH = re.compile("—|–|\\S - \\S")
PUBLIC_ONLY = re.compile(r"\.local\b|tailscale|192\.168\.|keyhouse", re.I)


def load_patterns(patterns_file):
    if not patterns_file:
        return []
    lines = [l.strip() for l in patterns_file.read_text().splitlines()]
    return [re.compile(l, re.I) for l in lines if l and not l.startswith("#")]


def shared_key_lines(text):
    """1-based numbers of the frontmatter `shared:` key lines and its list items."""
    exempt = set()
    in_shared = False
    for n, line in enumerate(header_lines(text), 2):
        if line.startswith("shared:"):
            in_shared = True
            exempt.add(n)
        elif in_shared and ITEM.match(line):
            exempt.add(n)
        else:
            in_shared = False
    return exempt


def scan_text(path, text, public, private):
    findings = []
    exempt = shared_key_lines(text)
    in_fence = False
    for n, line in enumerate(text.splitlines(), 1):
        def add(rule):
            findings.append(Finding(path, n, rule, line.strip()))

        fence = line.startswith("```")
        if fence:
            in_fence = not in_fence
        for rule, rx in RULES:
            if rx.search(line):
                add(rule)
        if any(m.group(1).rstrip(".").lower() != "example.com" for m in EMAIL.finditer(line)):
            add("email")
        if not in_fence and not fence and DASH.search(line):
            add("dash")
        if any(rx.search(line) for rx in private):
            add("private-term")
        if public and n not in exempt and PUBLIC_ONLY.search(line):
            add("public-only")
    return findings


def scan_skill(skill_dir: Path, public: bool, patterns_file: Path | None) -> list[Finding]:
    private = load_patterns(patterns_file)
    findings = []
    for p in sorted(skill_dir.rglob("*")):
        rel = p.relative_to(skill_dir)
        if not p.is_file() or ".sync" in rel.parts:
            continue
        try:
            text = p.read_text()
        except UnicodeDecodeError:
            continue
        findings += scan_text(str(p), text, public, private)
    return findings


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("skill_dirs", nargs="+", type=Path)
    ap.add_argument("--public", action="store_true")
    ap.add_argument("--patterns", type=Path)
    args = ap.parse_args()
    found = []
    try:
        for d in args.skill_dirs:
            if not d.is_dir():
                raise NotADirectoryError(f"not a directory: {d}")
            found += scan_skill(d, args.public, args.patterns)
    except (OSError, re.error) as e:
        print(f"scan.py: error: {e}", file=sys.stderr)
        sys.exit(2)
    for f in found:
        print(f"{f.path}:{f.line}: {f.rule}: {f.text}")
    sys.exit(1 if found else 0)


if __name__ == "__main__":
    main()
