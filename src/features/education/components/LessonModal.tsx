import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Target, Play, Trophy, BookOpen, Zap, DollarSign, Check, ArrowRight,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { formatMoney2 } from '@/lib/format';
import { completeQuiz } from '../api/educationApi';
import type { EduQuestion, EduTopic, FamilyMember } from '@/types/db';

type Props = {
  open: boolean;
  topic: EduTopic | null;
  questions: EduQuestion[];
  member: FamilyMember;
  householdRewardAmount?: number;
  onClose: () => void;
  onCompleted: () => void;
};

type Step = 'intro' | 'quiz' | 'results';

export function LessonModal({ open, topic, questions, member, householdRewardAmount, onClose, onCompleted }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('intro');
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [reward, setReward] = useState<{ xp: number; money: number } | null>(null);
  const [claiming, setClaiming] = useState(false);

  if (!topic) return null;

  const score = questions.reduce(
    (s, q, i) => s + (answers[i] === q.correct_index ? 1 : 0),
    0
  );
  const passed = score >= Math.ceil(questions.length * 0.67);

  const reset = () => {
    setStep('intro');
    setQIdx(0);
    setAnswers({});
    setReward(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const select = (optIdx: number) => {
    if (answers[qIdx] !== undefined) return;
    setAnswers({ ...answers, [qIdx]: optIdx });
  };

  const next = () => {
    if (qIdx < questions.length - 1) setQIdx(qIdx + 1);
    else setStep('results');
  };

  const claim = async () => {
    setClaiming(true);
    try {
      const result = await completeQuiz({
        member,
        topic,
        score,
        totalQuestions: questions.length,
        householdRewardAmount: householdRewardAmount != null ? householdRewardAmount : null,
      });
      setReward({ xp: result.xpAwarded, money: result.rewardAmount });
      onCompleted();
    } catch {
      // still close on error
    } finally {
      setClaiming(false);
    }
  };

  const subtitle = `${topic.lesson_count} ${t('education.lesson.lessonsLabel')} · ${topic.length_label || ''}`;

  return (
    <Modal open={open} title={topic.title} subtitle={subtitle} onClose={handleClose}>
      {/* Intro */}
      {step === 'intro' && (
        <>
          {topic.video_url ? (
            <div className="edu-lesson-video">
              <iframe
                src={topic.video_url.replace('watch?v=', 'embed/')}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={topic.title}
              />
            </div>
          ) : (
            <div
              className="edu-lesson-video"
              style={{
                background: `linear-gradient(135deg, ${topic.color || '#25D366'}, ${topic.color || '#25D366'}AA)`,
              }}
            >
              <div className="edu-lesson-video__play"><Play size={32} strokeWidth={2} /></div>
              <div className="edu-lesson-video__label">
                <Play size={14} strokeWidth={2} /> {topic.title}
              </div>
            </div>
          )}

          {topic.description && (
            <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--neutral-700)', margin: '0 0 18px' }}>
              {topic.description}
            </p>
          )}

          <div className="edu-objectives">
            <div className="edu-objectives__icon"><Target size={20} strokeWidth={2} /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{t('education.lesson.objectives')}</div>
              <ul>
                <li>{t('education.lesson.obj1', { topic: topic.title.toLowerCase() })}</li>
                <li>{t('education.lesson.obj2')}</li>
                <li>{t('education.lesson.obj3', { topic: topic.title })}</li>
              </ul>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
              {t('education.lesson.quizNote', { count: questions.length })}
            </span>
            <button
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => setStep('quiz')}
              disabled={questions.length === 0}
            >
              {t('education.lesson.startQuiz')} <ArrowRight size={15} strokeWidth={2} />
            </button>
          </div>
        </>
      )}

      {/* Quiz */}
      {step === 'quiz' && questions.length > 0 && (() => {
        const q = questions[qIdx];
        const selected = answers[qIdx];
        const answered = selected !== undefined;
        const opts = (q.options || []) as string[];
        return (
          <div>
            <div className="edu-quiz-header">
              <span style={{ fontWeight: 700, fontSize: 13 }}>
                {t('education.quiz.questionOf', { current: qIdx + 1, total: questions.length })}
              </span>
              <span style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
                {t('education.quiz.score')}: {Object.keys(answers).filter(
                  (k) => answers[Number(k)] === questions[Number(k)]?.correct_index
                ).length} / {questions.length}
              </span>
            </div>

            <div className="edu-quiz-progress">
              <div
                className="edu-quiz-progress__fill"
                style={{ width: ((qIdx + (answered ? 1 : 0)) / questions.length) * 100 + '%' }}
              />
            </div>

            <div className="edu-quiz-question">{q.question}</div>

            <div className="edu-quiz-options">
              {opts.map((opt, i) => {
                let cls = 'edu-quiz-option';
                if (answered) {
                  if (i === q.correct_index) cls += ' correct';
                  else if (i === selected) cls += ' wrong';
                }
                return (
                  <button
                    key={i}
                    className={cls}
                    disabled={answered}
                    onClick={() => select(i)}
                  >
                    <span className="edu-quiz-option__letter">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span style={{ flex: 1 }}>{opt}</span>
                    {answered && i === q.correct_index && <Check size={15} strokeWidth={2.5} />}
                    {answered && i === selected && i !== q.correct_index && (
                      <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: 16, lineHeight: 1 }}>✕</span>
                    )}
                  </button>
                );
              })}
            </div>

            {answered && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
                <button
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  onClick={next}
                >
                  {qIdx < questions.length - 1
                    ? t('education.quiz.next')
                    : t('education.quiz.seeResults')}
                  <ArrowRight size={15} strokeWidth={2} />
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Results */}
      {step === 'results' && (
        <div className="edu-results">
          <div
            className="edu-results__circle"
            style={{ background: passed ? 'var(--secondary-mint, #DCFAE6)' : 'var(--tertiary-warm, #FFF4E0)' }}
          >
            {passed
              ? <Trophy size={36} strokeWidth={1.5} style={{ color: '#F59E0B' }} />
              : <BookOpen size={36} strokeWidth={1.5} style={{ color: '#F97316' }} />
            }
          </div>
          <div className="edu-results__title">
            {passed
              ? t('education.results.passed', { name: member.name.split(' ')[0] })
              : t('education.results.failed')}
          </div>
          <div className="edu-results__sub">
            {t('education.results.score', { score, total: questions.length })}
            {passed && !reward && (
              <> · {t('education.results.badge', { topic: topic.title })}</>
            )}
          </div>

          {reward && (reward.xp > 0 || reward.money > 0) && (
            <div className="edu-results__reward">
              {reward.xp > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Zap size={15} strokeWidth={2} /> +{reward.xp} XP
                </span>
              )}
              {reward.money > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <DollarSign size={15} strokeWidth={2} /> +{formatMoney2(reward.money)}
                </span>
              )}
            </div>
          )}

          <div className="edu-results__actions">
            <button className="btn btn-outlined" onClick={handleClose}>
              {t('common.close')}
            </button>
            {passed ? (
              <button
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onClick={claim}
                disabled={claiming || !!reward}
              >
                {reward
                  ? <><Check size={14} strokeWidth={2.5} /> {t('education.results.claimed')}</>
                  : t('education.results.claimBadge')
                }
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => { setStep('quiz'); setQIdx(0); setAnswers({}); }}
              >
                {t('education.results.tryAgain')}
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
