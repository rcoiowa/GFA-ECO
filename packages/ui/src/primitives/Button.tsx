import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'support' | 'danger';

const styles: Record<Variant, string> = {
  primary:
    'bg-experience-600 text-white hover:bg-experience-700 disabled:bg-ink-faint',
  secondary:
    'bg-surface-raised text-ink border border-line hover:bg-surface-sunken disabled:text-ink-faint',
  ghost: 'bg-transparent text-experience-700 hover:bg-experience-soft disabled:text-ink-faint',
  support: 'bg-support-600 text-white hover:bg-support-700',
  danger:
    'bg-critical-50 text-critical-700 border border-critical-600/30 hover:bg-critical-600 hover:text-white',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'lg';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const sizing = size === 'lg' ? 'min-h-12 px-6 text-lg' : 'min-h-11 px-4 text-base';
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed ${sizing} ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
