import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  fullWidth,
  loading,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    'fl-btn',
    `fl-btn--${variant}`,
    fullWidth ? 'fl-btn--block' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading ? <span className="fl-btn__spinner" /> : children}
    </button>
  );
}
