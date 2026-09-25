const ALLOWED = new Set([
  '/recovery-residences/my-application',
  '/recovery-residences/grace-house/apply',
  '/recovery-residences/ejwrh/apply',
  '/recovery-residences/list-your-residence',
  '/home',
]);
export function safeAuthReturnPath(value: string | null | undefined): string | null {
  return value && ALLOWED.has(value) ? value : null;
}
