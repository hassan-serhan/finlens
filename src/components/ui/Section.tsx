import type { ReactNode } from 'react';
import './Section.css';

type SectionProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function Section({ title, subtitle, action, children }: SectionProps) {
  return (
    <section className="fl-section">
      <header className="fl-section__head">
        <div>
          <h2 className="fl-section__title">{title}</h2>
          {subtitle && <p className="fl-section__sub">{subtitle}</p>}
        </div>
        {action && <div className="fl-section__action">{action}</div>}
      </header>
      <div className="fl-section__body">{children}</div>
    </section>
  );
}
