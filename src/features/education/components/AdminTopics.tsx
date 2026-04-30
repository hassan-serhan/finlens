import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Trophy, Check, X } from 'lucide-react';
import { formatMoney2 } from '@/lib/format';
import { upsertHouseholdReward } from '../api/educationApi';
import type { EduBadge, EduHouseholdReward, EduProgress, EduQuestion, EduTopic, FamilyMember } from '@/types/db';

type Props = {
  householdId: string;
  topics: EduTopic[];
  questions: Map<string, EduQuestion[]>;
  rewards: Map<string, EduHouseholdReward>;
  allProgress: EduProgress[];
  allBadges: EduBadge[];
  members: FamilyMember[];
  onReload: () => Promise<void>;
};

const AVATAR_COLORS = ['#25D366', '#6C5CE7', '#FD79A8', '#FDCB6E', '#00CEC9', '#E17055'];

export function AdminTopics({ householdId, topics, questions, rewards, allProgress, allBadges, members, onReload }: Props) {
  const { t } = useTranslation();

  const badgesByMember = useMemo(() => {
    const map = new Map<string, EduBadge[]>();
    allBadges.forEach((b) => {
      const arr = map.get(b.member_id);
      if (arr) arr.push(b);
      else map.set(b.member_id, [b]);
    });
    return map;
  }, [allBadges]);

  // Effective reward for a topic: household override → platform default
  const getEffectiveReward = (topic: EduTopic): number => {
    const override = rewards.get(topic.id);
    return override != null ? Number(override.reward_amount) : Number(topic.reward_amount);
  };

  return (
    <>
      {/* Reward configuration */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          {t('education.admin.rewardsTitle')}
        </div>
        <div style={{ fontSize: 13, color: 'var(--neutral-500)', marginBottom: 16 }}>
          {t('education.admin.rewardsSubtitle')}
        </div>

        {topics.length === 0 ? (
          <div className="empty">{t('education.admin.empty')}</div>
        ) : (
          <div className="edu-admin-list">
            {topics.map((topic) => {
              const qs = questions.get(topic.id) || [];
              const completedCount = allProgress.filter(
                (p) => p.topic_id === topic.id && p.passed
              ).length;
              const effectiveReward = getEffectiveReward(topic);
              const hasOverride = rewards.has(topic.id);

              return (
                <div key={topic.id} className="edu-admin-topic">
                  <div
                    className="edu-admin-topic__icon"
                    style={{ background: topic.bg || '#F0FFF4', color: topic.color || '#25D366' }}
                  >
                    {topic.icon
                      ? <span style={{ fontSize: 20 }}>{topic.icon}</span>
                      : <BookOpen size={20} strokeWidth={1.5} />
                    }
                  </div>
                  <div className="edu-admin-topic__info">
                    <div className="edu-admin-topic__title">{topic.title}</div>
                    <div className="edu-admin-topic__meta">
                      <span>{qs.length} {t('education.admin.questions')}</span>
                      <span>+{topic.xp_reward} XP</span>
                      <span>{completedCount}/{members.length} {t('education.admin.passed')}</span>
                    </div>
                  </div>
                  <RewardInput
                    householdId={householdId}
                    topicId={topic.id}
                    currentAmount={effectiveReward}
                    platformDefault={Number(topic.reward_amount)}
                    hasOverride={hasOverride}
                    onSaved={onReload}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Per-member progress */}
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
        {t('education.admin.progressTitle')}
      </div>

      {members.length === 0 ? (
        <div className="empty">{t('education.admin.noMembers')}</div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {members.map((m, mi) => {
            const mProgress = allProgress.filter((p) => p.member_id === m.id);
            const mBadges = badgesByMember.get(m.id) || [];
            const passedCount = mProgress.filter((p) => p.passed).length;
            const totalReward = mProgress
              .filter((p) => p.passed)
              .reduce((sum, p) => {
                const tp = topics.find((t) => t.id === p.topic_id);
                return tp ? sum + getEffectiveReward(tp) : sum;
              }, 0);
            const color = AVATAR_COLORS[mi % AVATAR_COLORS.length];

            return (
              <div key={m.id} style={{ padding: 16, borderRadius: 14, background: 'var(--neutral-50)' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: color + '22', color,
                      display: 'grid', placeItems: 'center',
                      fontWeight: 700, fontSize: 14,
                    }}
                  >
                    {m.initials || m.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--neutral-500)' }}>
                      {passedCount}/{topics.length} {t('education.admin.topicsPassed')} · {m.xp || 0} XP
                      {totalReward > 0 && ` · ${t('education.admin.earned')} ${formatMoney2(totalReward)}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {mBadges.slice(0, 5).map((b) => (
                      <span key={b.id} title={b.badge_name} style={{ fontSize: 18, color: '#F59E0B', display: 'inline-flex' }}>
                        <Trophy size={18} strokeWidth={1.5} />
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 6 }}>
                  {topics.map((tp) => {
                    const prog = mProgress.find((p) => p.topic_id === tp.id);
                    const pct = prog?.percent ?? 0;
                    const passed = prog?.passed ?? false;
                    return (
                      <div key={tp.id} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
                        <span style={{ width: 20, textAlign: 'center', display: 'inline-flex', color: tp.color || '#25D366' }}>
                          {tp.icon
                            ? <span style={{ fontSize: 14 }}>{tp.icon}</span>
                            : <BookOpen size={14} strokeWidth={2} />
                          }
                        </span>
                        <span style={{ flex: 1, fontWeight: 500 }}>{tp.title}</span>
                        <div style={{ width: 80 }}>
                          <div className="edu-xp-bar">
                            <div
                              className="edu-xp-bar__fill"
                              style={{
                                width: pct + '%',
                                background: passed ? 'var(--primary)' : 'var(--neutral-400)',
                              }}
                            />
                          </div>
                        </div>
                        <span style={{
                          width: 70, textAlign: 'end', fontWeight: 600,
                          color: passed ? 'var(--primary-900)' : 'var(--neutral-500)',
                        }}>
                          {passed
                            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <Check size={12} strokeWidth={2.5} /> {prog!.best_score}/{prog!.total_questions}
                              </span>
                            : pct > 0 ? `${pct}%` : '—'
                          }
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Inline reward editor per topic ──────────────────────────────────

function RewardInput({
  householdId,
  topicId,
  currentAmount,
  platformDefault,
  hasOverride,
  onSaved,
}: {
  householdId: string;
  topicId: string;
  currentAmount: number;
  platformDefault: number;
  hasOverride: boolean;
  onSaved: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(currentAmount));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await upsertHouseholdReward(householdId, topicId, Number(value) || 0);
      setEditing(false);
      await onSaved();
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 13, color: 'var(--neutral-500)' }}>$</span>
        <input
          className="input"
          type="number"
          min={0}
          step={0.5}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ width: 80, padding: '6px 8px', fontSize: 13 }}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
          {saving ? '…' : <Check size={14} strokeWidth={2.5} />}
        </button>
        <button className="btn btn-outlined btn-sm" onClick={() => { setEditing(false); setValue(String(currentAmount)); }}>
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
      <div style={{ textAlign: 'end' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--primary-900)' }}>
          {currentAmount > 0 ? formatMoney2(currentAmount) : '—'}
        </div>
        {hasOverride && (
          <div style={{ fontSize: 11, color: 'var(--neutral-400)' }}>
            {t('education.admin.platformDefault')}: {formatMoney2(platformDefault)}
          </div>
        )}
      </div>
      <button className="btn btn-outlined btn-sm" onClick={() => { setValue(String(currentAmount)); setEditing(true); }}>
        {t('education.admin.setReward')}
      </button>
    </div>
  );
}
