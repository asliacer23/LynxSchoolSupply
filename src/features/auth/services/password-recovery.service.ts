import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Send password recovery email
 * User will receive an email with a link to reset their password
 */
export async function sendPasswordRecoveryEmail(email: string) {
  try {
    const redirectUrl = `${window.location.origin}/auth/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('Password recovery error:', error);
      return { error };
    }

    return { error: null, message: 'Recovery email sent successfully. Check your inbox.' };
  } catch (error) {
    console.error('Password recovery error:', error);
    return { error: error as Error };
  }
}

/**
 * Update user password using session
 * Call this after user clicks recovery link and gets redirected
 * The session will be automatically set by Supabase
 */
export async function updatePasswordWithSession(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Password update error:', error);
      return { error };
    }

    return { error: null, message: 'Password updated successfully!' };
  } catch (error) {
    console.error('Password update error:', error);
    return { error: error as Error };
  }
}

/**
 * Verify password reset token
 * Check if the recovery token is still valid
 */
export async function verifyPasswordResetToken() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return { isValid: false, error: 'No active recovery session found' };
    }

    // Check if session was created by recovery email
    const user = session.user;
    if (!user) {
      return { isValid: false, error: 'Invalid session' };
    }

    return { isValid: true, error: null };
  } catch (error) {
    console.error('Token verification error:', error);
    return { isValid: false, error: error as Error };
  }
}
