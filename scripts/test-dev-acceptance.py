#!/usr/bin/env python3
"""Run the DEV acceptance SQL batteries against a disposable bootstrap — Phase C2.

Creates a fresh disposable container via scripts/bootstrap-dev.py (live-parity
profile + DEV fixtures), applies every battery in tests/acceptance/sql/ in
sorted order, and destroys the container. Local Unix Docker socket only; the
bootstrap itself refuses any production reference. No network targets exist.

Usage: python3 scripts/test-dev-acceptance.py [--container NAME]
  --container NAME  reuse an existing bootstrap container (skips bootstrap).
"""
from pathlib import Path
import argparse, re, subprocess, sys

ROOT = Path(__file__).resolve().parents[1]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--container')
    args = ap.parse_args()

    name = args.container
    created = False
    if not name:
        r = subprocess.run([sys.executable, str(ROOT / 'scripts/bootstrap-dev.py'),
                            '--with-fixtures', '--keep'], capture_output=True, text=True)
        sys.stdout.write(r.stdout[-2000:])
        if r.returncode:
            sys.stderr.write(r.stderr[-3000:])
            sys.exit('bootstrap failed')
        m = re.search(r'KEPT container (\S+)', r.stdout)
        if not m:
            sys.exit('could not determine bootstrap container name')
        name = m.group(1)
        created = True

    failed = 0
    try:
        for battery in sorted((ROOT / 'tests/acceptance/sql').glob('*.sql')):
            r = subprocess.run(['docker', 'exec', '-i', name, 'psql', '-X', '-q', '-U', 'postgres'],
                               input=battery.read_text(), text=True, capture_output=True)
            ok = r.returncode == 0 and 'PASSED' in r.stdout
            print(('PASS' if ok else 'FAIL'), battery.name, flush=True)
            if not ok:
                failed += 1
                sys.stderr.write((r.stderr or r.stdout)[-3000:] + '\n')
    finally:
        if created:
            subprocess.run(['docker', 'rm', '-f', name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
