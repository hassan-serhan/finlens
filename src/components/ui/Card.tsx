import type { HTMLAttributes, ReactNode } from 'react';
import './Card.css';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div className={['fl-card', className ?? ''].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  );
}
