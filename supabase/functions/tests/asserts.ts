// Minimal local assertions so receiver tests need no remote registry at all.

export function assertEquals(actual: unknown, expected: unknown, msg?: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(msg ?? `assertEquals failed:\n  actual:   ${a}\n  expected: ${e}`);
  }
}

export function assertStringIncludes(actual: string, expected: string, msg?: string): void {
  if (!actual.includes(expected)) {
    throw new Error(msg ?? `assertStringIncludes failed: ${JSON.stringify(expected)} not found`);
  }
}
