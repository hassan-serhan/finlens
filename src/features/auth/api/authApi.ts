import { supabase } from '@/lib/supabase';

export type SignUpInput = {
  email: string;
  password: string;
  fullName: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

export async function signUp({ email, password, fullName }: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });
  if (error) throw error;
  return data;
}

export async function signIn({ email, password }: SignInInput) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
