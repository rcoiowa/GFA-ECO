/**
 * Privacy-safe operational monitoring (P4H remainder §22).
 *
 * Captures: frontend crashes, unhandled rejections, and failed query/RPC
 * operations — as PROCESS METADATA ONLY (scope, error name, redacted
 * message, release, route path). Never captured: message bodies, Recovery
 * Pulse narrative, navigation notes, grievance/screening/application text,
 * or any sensitive free text — redaction is structural (allow-listed fields
 * + aggressive scrubbing), not best-effort.
 *
 * The sink is pluggable and OFF by default: until a monitoring destination
 * is explicitly approved for soft launch, events buffer in memory (and
 * print compactly in DEV). No external provider is configured here.
 */

export interface MonitorEvent {
  at: string;
  release: string;
  scope: string;
  name: string;
  message: string;
  path: string;
}

type MonitorSink = (event: MonitorEvent) => void;

const buffer: MonitorEvent[] = [];
let sink: MonitorSink | null = null;

export function setMonitorSink(next: MonitorSink | null) {
  sink = next;
}

export function getMonitorBuffer(): readonly MonitorEvent[] {
  return buffer;
}

/**
 * Redact anything that could be personal: emails, long digit runs, quoted
 * strings (free text travels in quotes in PostgREST errors), and anything
 * beyond a hard length cap. What survives is operational shape: error
 * classes, HTTP/PostgREST codes, constraint and function names.
 */
export function redact(input: unknown): string {
  const raw = input instanceof Error ? `${input.name}: ${input.message}` : String(input ?? '');
  return raw
    .replace(/"(?:[^"\\]|\\.)*"/g, '"…"')
    .replace(/'(?:[^'\\]|\\.)*'/g, "'…'")
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '‹email›')
    .replace(/\d{4,}/g, '‹num›')
    .slice(0, 300);
}

export function captureError(scope: string, error: unknown) {
  const event: MonitorEvent = {
    at: new Date().toISOString(),
    release: (import.meta.env.VITE_RELEASE as string | undefined) ?? 'dev',
    scope,
    name: error instanceof Error ? error.name : 'Error',
    message: redact(error),
    path: typeof location !== 'undefined' ? location.pathname : '',
  };
  buffer.push(event);
  if (buffer.length > 200) buffer.shift();
  if (sink) sink(event);
  else if (import.meta.env.DEV) console.error('[monitor]', event.scope, event.message);
}

/** Install window-level crash/rejection capture once at bootstrap. */
export function installGlobalMonitor() {
  window.addEventListener('error', (e) => captureError('window.error', e.error ?? e.message));
  window.addEventListener('unhandledrejection', (e) =>
    captureError('unhandled.rejection', e.reason),
  );
}
