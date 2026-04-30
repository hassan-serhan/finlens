import { useCallback, useEffect, useState } from 'react';
import {
  listTopics,
  listQuestions,
  listProgressForMember,
  listBadgesForMember,
  listProgressForHousehold,
  listBadgesForHousehold,
  listHouseholdRewards,
} from '../api/educationApi';
import type {
  EduBadge,
  EduHouseholdReward,
  EduProgress,
  EduQuestion,
  EduTopic,
  FamilyMember,
} from '@/types/db';

export type EducationData = {
  topics: EduTopic[];
  questions: Map<string, EduQuestion[]>;
  progress: Map<string, EduProgress>;
  badges: EduBadge[];
  // Household-specific reward overrides, keyed by topic_id.
  rewards: Map<string, EduHouseholdReward>;
  allProgress: EduProgress[];
  allBadges: EduBadge[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useEducation(
  householdId: string | null,
  memberId: string | null,
  isAdmin: boolean,
  householdMembers: FamilyMember[],
): EducationData {
  const [topics, setTopics] = useState<EduTopic[]>([]);
  const [questions, setQuestions] = useState<Map<string, EduQuestion[]>>(new Map());
  const [progress, setProgress] = useState<Map<string, EduProgress>>(new Map());
  const [badges, setBadges] = useState<EduBadge[]>([]);
  const [rewards, setRewards] = useState<Map<string, EduHouseholdReward>>(new Map());
  const [allProgress, setAllProgress] = useState<EduProgress[]>([]);
  const [allBadges, setAllBadges] = useState<EduBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Topics are platform-wide; household rewards are per-household
      const [ts, hhRewards] = await Promise.all([
        listTopics(),
        householdId ? listHouseholdRewards(householdId) : Promise.resolve([]),
      ]);
      setTopics(ts);

      const rMap = new Map<string, EduHouseholdReward>();
      hhRewards.forEach((r) => rMap.set(r.topic_id, r));
      setRewards(rMap);

      // Fetch questions for all topics in parallel
      const qResults = await Promise.all(ts.map((t) => listQuestions(t.id)));
      const qMap = new Map<string, EduQuestion[]>();
      ts.forEach((t, i) => qMap.set(t.id, qResults[i]));
      setQuestions(qMap);

      // Member's own progress + badges
      if (memberId) {
        const [prog, bdg] = await Promise.all([
          listProgressForMember(memberId),
          listBadgesForMember(memberId),
        ]);
        const pMap = new Map<string, EduProgress>();
        prog.forEach((p) => pMap.set(p.topic_id, p));
        setProgress(pMap);
        setBadges(bdg);
      }

      // Admin sees all household members' progress
      if (isAdmin && householdMembers.length > 0) {
        const memberIds = householdMembers.map((m) => m.id);
        const [ap, ab] = await Promise.all([
          listProgressForHousehold(memberIds),
          listBadgesForHousehold(memberIds),
        ]);
        setAllProgress(ap);
        setAllBadges(ab);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load education data');
    } finally {
      setLoading(false);
    }
  }, [householdId, memberId, isAdmin, householdMembers]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    topics,
    questions,
    progress,
    badges,
    rewards,
    allProgress,
    allBadges,
    loading,
    error,
    reload: load,
  };
}
