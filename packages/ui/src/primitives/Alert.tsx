import type { ReactNode } from 'react';

type Tone = 'info' | 'positive' | 'attention' | 'critical';

const tones: Record<Tone, string> = {
  info: 'bg-accent-50 text-accent-700 border-accent-500/30',
  positive: 'bg-positive-50 text-positive-700 border-positive-600/30',
  attention: 'bg-attention-50 text-attention-700 border-attention-600/30',
  critical: 'bg-critical-50 text-critical-700 border-critical-600/30',
};

export function Alert({ tone = 'info', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div
      role={tone === 'critical' ? 'alert' : 'status'}
      className={`rounded-md border px-4 py-3 ${tones[tone]}`}
    >
      {children}
    </div>
  );
}
