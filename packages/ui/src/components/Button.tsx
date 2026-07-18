import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-rs-primary text-rs-on-primary hover:opacity-90 focus-visible:ring-rs-secondary',
  secondary:
    'bg-rs-secondary text-rs-on-secondary hover:opacity-90 focus-visible:ring-rs-primary',
  ghost:
    'border border-rs-primary bg-transparent text-rs-primary hover:bg-rs-surface-container focus-visible:ring-rs-secondary',
  danger:
    'bg-rs-danger text-rs-on-error hover:opacity-90 focus-visible:ring-rs-error',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-base',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={[
          'inline-flex items-center justify-center gap-2 rounded-rs font-medium',
          'transition-opacity focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? 'w-full' : '',
          className,
        ].join(' ')}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
