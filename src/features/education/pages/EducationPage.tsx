import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { useHousehold } from '@/features/household/hooks/useHousehold';
import { useHouseholdData } from '@/contexts/HouseholdDataContext';
import { useEducation } from '../hooks/useEducation';
import { XpBanner } from '../components/XpBanner';
import { TopicCard } from '../components/TopicCard';
import { LessonModal } from '../components/LessonModal';
import { Leaderboard } from '../components/Leaderboard';
import { AdminTopics } from '../components/AdminTopics';
import type { EduTopic } from '@/types/db';
import '../components/Education.css';

type Tab = 'learn' | 'manage';
type Filter = 'all' | 'progress' | 'completed';

export function EducationPage() {
  const { t } = useTranslation();
  const { householdId, member, loading: hhLoading, error: hhError, refresh } = useHousehold();
  const { members, refreshMembers } = useHouseholdData();
  const isAdmin = member?.role === 'Admin';

  const {
    topics,
    questions,
    progress,
    badges,
    rewards,
    allProgress,
    allBadges,
    loading,
    error,
    reload,
  } = useEducation(householdId, member?.id ?? null, isAdmin, members);

  const [tab, setTab] = useState<Tab>('learn');
  const [filter, setFilter] = useState<Filter>('all');
  const [activeTopic, setActiveTopic] = useState<EduTopic | null>(null);

  const filteredTopics = topics.filter((topic) => {
    if (filter === 'all') return true;
    const p = progress.get(topic.id);
    if (filter === 'completed') return p?.passed;
    if (filter === 'progress') return p && !p.passed && p.percent > 0;
    return true;
  });

  return (
    <AppLayout>
      <header style={{ marginBlockEnd: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
              {t('education.pageTitle')}
            </h1>
            <p style={{ color: 'var(--neutral-500)', margin: '4px 0 0', fontSize: 13.5 }}>
              {t('education.pageSubtitle')}
            </p>
          </div>
          {isAdmin && (
            <div className="edu-tabs">
              <button
                className={'edu-tab' + (tab === 'learn' ? ' edu-tab--active' : '')}
                onClick={() => setTab('learn')}
              >
                {t('education.tabs.learn')}
              </button>
              <button
                className={'edu-tab' + (tab === 'manage' ? ' edu-tab--active' : '')}
                onClick={() => setTab('manage')}
              >
                {t('education.tabs.manage')}
              </button>
            </div>
          )}
        </div>
      </header>

      {hhLoading && <div className="empty">{t('common.loading')}</div>}
      {hhError && <div className="empty" style={{ color: 'var(--danger)' }}>{hhError}</div>}
      {error && <div className="empty" style={{ color: 'var(--danger)' }}>{error}</div>}

      {householdId && member && !loading && (
        <>
          {/* ── Learn tab ─────────────────────────────────────────── */}
          {tab === 'learn' && (
            <>
              <XpBanner member={member} badges={badges} />

              {/* Topics header + filter */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>
                    {t('education.topics.title')}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
                    {t('education.topics.subtitle')}
                  </div>
                </div>
                <div className="edu-filter-tabs">
                  {(['all', 'progress', 'completed'] as Filter[]).map((f) => (
                    <button
                      key={f}
                      className={'edu-filter-tab' + (filter === f ? ' edu-filter-tab--active' : '')}
                      onClick={() => setFilter(f)}
                    >
                      {t(`education.topics.filter.${f}`)}
                    </button>
                  ))}
                </div>
              </div>

              {filteredTopics.length === 0 ? (
                <div className="empty">
                  {topics.length === 0
                    ? t('education.topics.empty')
                    : t('education.topics.filterEmpty')}
                </div>
              ) : (
                <div className="edu-topics-grid">
                  {filteredTopics.map((topic) => (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      progress={progress.get(topic.id)}
                      onClick={() => setActiveTopic(topic)}
                    />
                  ))}
                </div>
              )}

              {/* Leaderboard */}
              {members.length > 0 && (
                <div className="card" style={{ marginTop: 24 }}>
                  <div className="card-header">
                    <div>
                      <div className="card-title">{t('education.leaderboard.title')}</div>
                      <div className="card-sub">{t('education.leaderboard.subtitle')}</div>
                    </div>
                  </div>
                  <Leaderboard
                    members={members}
                    allBadges={isAdmin ? allBadges : badges.map((b) => b)}
                  />
                </div>
              )}

              {/* Lesson modal */}
              <LessonModal
                open={!!activeTopic}
                topic={activeTopic}
                questions={activeTopic ? (questions.get(activeTopic.id) || []) : []}
                member={member}
                householdRewardAmount={
                  activeTopic && rewards.has(activeTopic.id)
                    ? Number(rewards.get(activeTopic.id)!.reward_amount)
                    : undefined
                }
                onClose={() => setActiveTopic(null)}
                onCompleted={() => { void reload(); refresh(); void refreshMembers(); }}
              />
            </>
          )}

          {/* ── Manage tab (admin only) ───────────────────────────── */}
          {tab === 'manage' && isAdmin && householdId && (
            <AdminTopics
              householdId={householdId}
              topics={topics}
              questions={questions}
              rewards={rewards}
              allProgress={allProgress}
              allBadges={allBadges}
              members={members}
              onReload={reload}
            />
          )}
        </>
      )}

      {householdId && loading && <div className="empty">{t('common.loading')}</div>}
    </AppLayout>
  );
}
