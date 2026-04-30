import { useTranslation } from 'react-i18next';
import { BookOpen, Clock, ArrowRight, Check } from 'lucide-react';
import type { EduProgress, EduTopic } from '@/types/db';

type Props = {
  topic: EduTopic;
  progress: EduProgress | undefined;
  onClick: () => void;
};

export function TopicCard({ topic, progress, onClick }: Props) {
  const { t } = useTranslation();
  const pct = progress?.percent ?? 0;
  const passed = progress?.passed ?? false;

  return (
    <div
      className="edu-topic-card"
      style={{ background: topic.bg || '#F0FFF4' }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="edu-topic-card__head">
        <div
          className="edu-topic-card__icon"
          style={{ color: topic.color || '#25D366' }}
        >
          {topic.icon
            ? <span style={{ fontSize: 28 }}>{topic.icon}</span>
            : <BookOpen size={28} strokeWidth={1.5} />
          }
        </div>
        {passed && (
          <span className="chip chip-primary">
            <Check size={11} strokeWidth={2.5} /> {t('education.topics.completed')}
          </span>
        )}
        {pct > 0 && !passed && (
          <span className="chip chip-warm">
            {t('education.topics.progress', { pct })}
          </span>
        )}
        {pct === 0 && (
          <span className="chip">{t('education.topics.new')}</span>
        )}
      </div>

      <div>
        <div className="edu-topic-card__title">{topic.title}</div>
        {topic.sub && <div className="edu-topic-card__sub">{topic.sub}</div>}
      </div>

      <div className="edu-topic-card__meta">
        <span className="edu-topic-card__meta-item">
          <BookOpen size={13} strokeWidth={2} />
          {' '}{t('education.topics.lessons', { count: topic.lesson_count })}
        </span>
        {topic.length_label && (
          <span className="edu-topic-card__meta-item">
            <Clock size={13} strokeWidth={2} />
            {' '}{topic.length_label}
          </span>
        )}
      </div>

      <div className="edu-xp-bar">
        <div className="edu-xp-bar__fill" style={{ width: pct + '%' }} />
      </div>

      <button className="btn btn-sm" style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {pct === 0
          ? t('education.topics.start')
          : passed
            ? t('education.topics.review')
            : t('education.topics.continue')}
        <ArrowRight size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
