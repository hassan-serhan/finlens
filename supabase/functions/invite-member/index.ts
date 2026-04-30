// Supabase Edge Function: invite-member
//
// Creates a new auth.users row with email + password (admin-set, no email
// confirmation needed) and inserts the matching family_members row.
// Only callable by an Admin of the target household.
//
// Deploy:
//   supabase functions deploy invite-member
//   supabase secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
//
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-populated by Supabase
//  when deployed, but listed here for clarity.)

// @ts-ignore Deno remote import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// @ts-ignore Deno global
const SERVICE_URL = Deno.env.get('SUPABASE_URL')!;
// @ts-ignore Deno global
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Body = {
  name: string;
  email: string;
  password: string;
  role: 'Admin' | 'Member';
  relation?: string;
  age?: number | null;
};

function bad(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

// @ts-ignore Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') return bad(405, 'Method not allowed');

  // 1. Verify caller's JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return bad(401, 'Missing Authorization header');
  const token = authHeader.replace('Bearer ', '');

  const userClient = createClient(SERVICE_URL, SERVICE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData.user) return bad(401, 'Invalid session');
  const callerId = userData.user.id;

  // 2. Look up the caller's family_members row → must be Admin
  const admin = createClient(SERVICE_URL, SERVICE_KEY);
  const { data: callerMember, error: callerErr } = await admin
    .from('family_members')
    .select('household_id, role')
    .eq('user_id', callerId)
    .maybeSingle();
  if (callerErr) return bad(500, callerErr.message);
  if (!callerMember || callerMember.role !== 'Admin') {
    return bad(403, 'Only household admins can invite members');
  }

  // 3. Parse + validate body
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return bad(400, 'Invalid JSON');
  }
  const { name, email, password, role, relation, age } = body;
  if (!name?.trim()) return bad(400, 'Name is required');
  if (!email?.includes('@')) return bad(400, 'Valid email is required');
  if (!password || password.length < 8) return bad(400, 'Password must be at least 8 characters');
  if (role !== 'Admin' && role !== 'Member') return bad(400, 'Invalid role');

  // 4. Create the auth user (admin-verified, no email confirmation needed).
  //    `app_metadata.invited = true` tells the on_auth_user_created trigger
  //    to skip the household-bootstrap (otherwise every invited member would
  //    also get their own brand-new household).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, invited: true },
    app_metadata: { invited: true, invited_by: callerId },
  });
  if (createErr || !created.user) return bad(400, createErr?.message ?? 'Failed to create user');

  const newUserId = created.user.id;
  const initials = (name.trim().split(/\s+/).map((s) => s[0]).join('').slice(0, 2)).toUpperCase();

  // 5. Insert the family_members row + member_permissions in one go
  const { data: member, error: memErr } = await admin
    .from('family_members')
    .insert({
      household_id: callerMember.household_id,
      user_id: newUserId,
      name: name.trim(),
      role,
      relation: relation ?? null,
      age: age ?? null,
      initials,
      invite_status: 'active',
    })
    .select()
    .single();

  if (memErr) {
    // Roll back the auth user so we don't end up with an orphan
    await admin.auth.admin.deleteUser(newUserId);
    return bad(500, memErr.message);
  }

  // 6. Permissions: Admin gets everything, Member gets everything except
  //    income/accounts management (manage_members stays admin-only).
  const isAdmin = role === 'Admin';
  await admin.from('member_permissions').insert({
    member_id: member.id,
    view_expenses: true,
    add_expenses: true,
    view_goals: true,
    contribute_goals: true,
    view_debts: true,
    manage_members: isAdmin,
  });

  return new Response(
    JSON.stringify({ ok: true, member }),
    { headers: { ...corsHeaders, 'content-type': 'application/json' } }
  );
});
