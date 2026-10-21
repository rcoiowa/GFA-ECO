#!/usr/bin/env python3
"""Bounded regression checks, not a certification of all editorial claims.

Scan current authored UI and public copy. Preserve source documents, quotations,
validated instruments, historical audits, and technical identifiers. Human review
still decides context, factual support, service availability, and release readiness.
"""
from pathlib import Path
import hashlib
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
TAGLINE = 'No Shame, No Stigma, Just Grace.'
ROOTS = ('apps/platform/src', 'apps/platform/public/gfa', 'packages/ui/src',
         'packages/safety/src', 'sites/recoveryresidence-directory')
RULES = (
    ('retired Grace role', re.compile(r'\b(?:Grace(?: AI)? (?:Peer )?Companion|AI peer(?:-support)? companion)\b', re.I)),
    ('unsupported immediate connection', re.compile(r'\b(?:real people are one tap away|you can reach a real person right now)\b', re.I)),
    ('unsupported neurological claim', re.compile(r'\b(?:re[- ]?engineer your brain|how recovery rebuilds it|the brain.s old survival pathway firing)\b', re.I)),
)
TAGLINE_PATTERN = re.compile(r'No\s+Shame[.,]?\s+No\s+Stigma[.,]?\s+Just\s+Grace[.!]?', re.I)

def inspect_text(text):
    findings = []
    for label, pattern in RULES:
        findings.extend((m.start(), label, m.group(0)) for m in pattern.finditer(text))
    for match in TAGLINE_PATTERN.finditer(text):
        if match.group(0) != TAGLINE:
            findings.append((match.start(), 'canonical tagline', match.group(0)))
    return findings

def check(root=ROOT):
    failures = []
    count = 0
    for relative in ROOTS:
        directory = root / relative
        if not directory.is_dir():
            failures.append(f'Missing required scan root: {relative}')
            continue
        for path in sorted(directory.rglob('*')):
            if path.suffix not in ('.ts', '.tsx', '.js', '.html') or any(x in path.name for x in ('.test.', '.spec.', '.generated.')):
                continue
            count += 1
            text = path.read_text()
            for offset, label, value in inspect_text(text):
                line = text[:offset].count('\n') + 1
                failures.append(f'{path.relative_to(root)}:{line}: {label}: {value}')
    policy = (root / 'supabase/functions/grace/policy.ts').read_text()
    floor = re.search(r'export function deterministicSafetyFloor[\s\S]*?\n\}', policy)
    expected = 'd83001720a4e66b2db797f2821b8e7e1c2b82a5fecf08b3e30bfe557d7378494'
    if not floor or hashlib.sha256(floor.group(0).encode()).hexdigest() != expected:
        failures.append('Safety floor changed: this editorial patch must preserve the approved routing function.')
    if '"return to use" (never\n"relapse")' in policy:
        failures.append('Grace still applies the retired automatic self-description substitution.')
    if "POLICY_VERSION = 'grace-policy-1.2.1'" not in policy:
        failures.append('Candidate editorial policy version must be recorded independently of historical evaluation.')
    source = (root / 'docs/source-documents/language-guide/2026-10-21.txt').read_text()
    guide = (root / 'docs/language-guide.md').read_text()
    # Every nonblank source line must survive Markdown presentation changes.
    for line in source.splitlines()[1:]:
        text = line.strip()
        if text and text not in guide:
            failures.append(f'Canonical guide lost source text: {text[:100]}')
    return count, failures

if __name__ == '__main__':
    count, failures = check()
    for failure in failures:
        print(f'ERROR: {failure}', file=sys.stderr)
    if failures:
        sys.exit(1)
    print(f'Language regression checks passed across {count} authored files; contextual and live acceptance review remains required.')
