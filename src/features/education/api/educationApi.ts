import { supabase } from '@/lib/supabase';
import { getOrCreateWallet, recordAllowance } from '@/features/family/api/familyApi';
import type {
  EduBadge,
  EduHouseholdReward,
  EduProgress,
  EduQuestion,
  EduTopic,
  FamilyMember,
} from '@/types/db';

// ── Topics (platform-wide, read-only) ───────────────────────────────

export async function listTopics(): Promise<EduTopic[]> {
  const { data, error } = await supabase
    .from('edu_topics')
    .select('*')
    .order('sort_order')
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as EduTopic[];
}

// ── Questions (platform-wide, read-only) ────────────────────────────

export async function listQuestions(topicId: string): Promise<EduQuestion[]> {
  const { data, error } = await supabase
    .from('edu_questions')
    .select('*')
    .eq('topic_id', topicId)
    .order('position');
  if (error) throw error;
  return (data ?? []) as EduQuestion[];
}

// ── Progress ────────────────────────────────────────────────────────

export async function listProgressForMember(
  memberId: string
): Promise<EduProgress[]> {
  const { data, error } = await supabase
    .from('edu_progress')
    .select('*')
    .eq('member_id', memberId);
  if (error) throw error;
  return (data ?? []) as EduProgress[];
}

export async function listProgressForHousehold(
  memberIds: string[],
): Promise<EduProgress[]> {
  if (memberIds.length === 0) return [];
  const { data, error } = await supabase
    .from('edu_progress')
    .select('*')
    .in('member_id', memberIds);
  if (error) throw error;
  return (data ?? []) as EduProgress[];
}

// ── Badges ──────────────────────────────────────────────────────────

export async function listBadgesForMember(
  memberId: string
): Promise<EduBadge[]> {
  const { data, error } = await supabase
    .from('edu_badges')
    .select('*')
    .eq('member_id', memberId)
    .order('earned_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as EduBadge[];
}

export async function listBadgesForHousehold(
  memberIds: string[],
): Promise<EduBadge[]> {
  if (memberIds.length === 0) return [];
  const { data, error } = await supabase
    .from('edu_badges')
    .select('*')
    .in('member_id', memberIds);
  if (error) throw error;
  return (data ?? []) as EduBadge[];
}

// ── Household rewards (admin-configurable per topic) ────────────────

export async function listHouseholdRewards(
  householdId: string
): Promise<EduHouseholdReward[]> {
  const { data, error } = await supabase
    .from('edu_household_rewards')
    .select('*')
    .eq('household_id', householdId);
  if (error) throw error;
  return (data ?? []) as EduHouseholdReward[];
}

export async function upsertHouseholdReward(
  householdId: string,
  topicId: string,
  rewardAmount: number
): Promise<EduHouseholdReward> {
  const { data, error } = await supabase
    .from('edu_household_rewards')
    .upsert(
      {
        household_id: householdId,
        topic_id: topicId,
        reward_amount: rewardAmount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'household_id,topic_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data as EduHouseholdReward;
}

// ── Quiz completion + reward ────────────────────────────────────────

export async function completeQuiz(params: {
  member: FamilyMember;
  topic: EduTopic;
  score: number;
  totalQuestions: number;
  // Household-specific reward override. Falls back to topic.reward_amount.
  householdRewardAmount?: number | null;
}): Promise<{ badge: EduBadge | null; xpAwarded: number; rewardAmount: number }> {
  const { member, topic, score, totalQuestions, householdRewardAmount } = params;
  const passed = score >= Math.ceil(totalQuestions * 0.67);

  const { error: pErr } = await supabase
    .from('edu_progress')
    .upsert(
      {
        member_id: member.id,
        topic_id: topic.id,
        percent: passed ? 100 : Math.round((score / totalQuestions) * 100),
        best_score: score,
        total_questions: totalQuestions,
        passed,
        completed_at: passed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'member_id,topic_id' }
    );
  if (pErr) throw pErr;

  if (!passed) return { badge: null, xpAwarded: 0, rewardAmount: 0 };

  // No double-reward
  const { data: existing } = await supabase
    .from('edu_badges')
    .select('id')
    .eq('member_id', member.id)
    .eq('topic_id', topic.id)
    .maybeSingle();

  if (existing) return { badge: null, xpAwarded: 0, rewardAmount: 0 };

  const { data: badge, error: bErr } = await supabase
    .from('edu_badges')
    .insert({
      member_id: member.id,
      topic_id: topic.id,
      badge_name: `${topic.title} Hero`,
    })
    .select()
    .single();
  if (bErr) throw bErr;

  // Award XP
  const xp = topic.xp_reward || 500;
  const { error: xErr } = await supabase.rpc('increment_member_xp', {
    p_member_id: member.id,
    p_amount: xp,
  });
  if (xErr) {
    await supabase
      .from('family_members')
      .update({ xp: (member.xp || 0) + xp })
      .eq('id', member.id);
  }

  // Wallet reward — household override takes priority over platform default
  const effectiveReward = householdRewardAmount != null
    ? householdRewardAmount
    : Number(topic.reward_amount);
  let rewardAmount = 0;
  if (effectiveReward > 0) {
    const wallet = await getOrCreateWallet(member);
    await recordAllowance({
      wallet,
      kind: 'credit',
      amount: effectiveReward,
      reason: `Quiz reward: ${topic.title}`,
      approvedBy: null,
    });
    rewardAmount = effectiveReward;
  }

  return { badge: badge as EduBadge, xpAwarded: xp, rewardAmount };
}
