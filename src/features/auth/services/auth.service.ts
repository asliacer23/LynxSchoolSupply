import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export async function signIn(data: LoginInput) {
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
  return { error };
}

/**
 * Signup with Supabase Auth
 * 
 * Supabase automatically handles:
 * - Email confirmation (sends confirmation email)
 * - User creation
 * - Password hashing
 * 
 * The confirmation email is sent by Supabase if:
 * 1. Email confirmation is enabled in Supabase project settings
 * 2. SMTP/Email provider is configured
 * 3. User confirms email to complete registration
 */
export async function signUp(data: RegisterInput) {
  const redirectUrl = `${window.location.origin}/auth/login`;
  
  try {
    // Create Supabase auth user
    // Supabase will automatically send confirmation email to this email address
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { 
          full_name: data.fullName,
        },
      },
    });

    if (authError) {
      console.error('Signup error:', authError);
      return { error: authError };
    }

    if (!authData.user?.id) {
      return { error: new Error('Failed to create user') };
    }

    const userId = authData.user.id;

    // Create profile entry with upsert to handle unconfirmed users
    // This runs asynchronously and doesn't block signup
    createProfileAndAssignRole(userId, data.fullName, data.email);

    return { error: null };
  } catch (error) {
    console.error('Signup error:', error);
    return { error: error as Error };
  }
}

/**
 * Create profile and assign default role
 * Runs asynchronously in background - doesn't block signup flow
 */
async function createProfileAndAssignRole(userId: string, fullName: string, email: string) {
  try {
    // Create profile using upsert
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        email: email,
        is_active: true,
      }, {
        onConflict: 'id',
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return;
    }

    // Assign 'user' role
    const { data: roleData } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'user')
      .single();

    if (roleData) {
      await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role_id: roleData.id,
        }, {
          onConflict: 'user_id,role_id',
        });
      
      console.log('✅ Profile and role created for user:', userId);
    }
  } catch (error) {
    console.error('Background profile creation failed:', error);
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
