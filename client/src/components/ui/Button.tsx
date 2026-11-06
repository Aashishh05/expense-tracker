import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/format';
import { Loader } from './Loader';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-[#940125] disabled:hover:bg-accent',
  secondary: 'bg-accent-soft text-accent hover:bg-[#edd0d2]',
  danger: 'bg-expense text-white hover:bg-[#8a0e30] disabled:hover:bg-expense',
  ghost: 'text-ink-2 hover:bg-ink/[0.05] hover:text-ink disabled:hover:bg-transparent',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13.5px]',
  md: 'h-10 px-4 text-[14.5px]',
  lg: 'h-11 px-5 text-[15px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 rounded-xl font-medium',
        'transition-[transform,background-color,opacity] duration-100 active:scale-[0.97]',
        'disabled:cursor-not-allowed disabled:opacity-55',
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {loading && <Loader className="h-4 w-4" />}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: 'default' | 'danger' | 'accent';
}

/** Square icon-only button; `label` becomes the accessible name. */
export function IconButton({ label, tone = 'default', className, children, ...rest }: IconButtonProps) {
  const tones = {
    default: 'text-ink-3 hover:bg-ink/[0.05] hover:text-ink',
    danger: 'text-ink-3 hover:bg-expense-soft hover:text-expense',
    accent: 'text-ink-3 hover:bg-accent-soft hover:text-accent',
  };
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'grid h-9 w-9 place-items-center rounded-lg transition-colors duration-100 active:scale-95',
        tones[tone],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
