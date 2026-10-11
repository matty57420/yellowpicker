import clsx from 'clsx';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink hover:bg-yellow-300',
  ghost: 'border border-line text-zinc-200 hover:bg-white/5',
  danger: 'border border-red-500/40 text-red-300 hover:bg-red-500/10',
};

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function TextField({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={clsx('flex flex-col gap-1 text-sm', className)}>
      <span className="text-muted">{label}</span>
      <input
        className="rounded-lg border border-line bg-ink px-3 py-2 text-zinc-100 outline-none focus:border-accent"
        {...props}
      />
    </label>
  );
}

export function ErrorMessage({ error }: { error: Error | null }) {
  if (!error) {
    return null;
  }
  return (
    <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {error.message}
    </p>
  );
}

export function Avatar({
  src,
  alt,
  size = 'md',
}: {
  src: string;
  alt: string;
  size?: 'sm' | 'md';
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={clsx(
        'rounded-full border-2 border-panel object-cover',
        size === 'sm' ? 'size-8' : 'size-12',
      )}
    />
  );
}

export function PageHeader({ children }: { children: ReactNode }) {
  return (
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 pt-8 pb-6">
      {children}
    </header>
  );
}
