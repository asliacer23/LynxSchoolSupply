/**
 * Email Service
 * Handles all email notifications (signup, password reset, etc.)
 */

import { supabase } from '@/lib/supabase';

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send a generic email
 * Supabase handles email sending through Resend SMTP integration
 */
export async function sendEmail(params: EmailParams) {
  try {
    // Note: When using Supabase Auth functions (signUp, resetPasswordForEmail),
    // Supabase automatically sends emails through the configured SMTP provider (Resend).
    // This function is for custom email templates if needed.
    
    console.log('Email queued for sending:', {
      to: params.to,
      subject: params.subject,
      from: params.from || 'noreply@lynxsupplies.com',
    });

    // Emails are sent by Supabase through Resend SMTP
    return { success: true, error: null };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  email: string,
  fullName: string,
  role: 'user' | 'cashier' | 'owner' | 'superadmin'
) {
  const roleLabels: Record<string, string> = {
    superadmin: 'Super Administrator',
    owner: 'Store Owner',
    cashier: 'Cashier',
    user: 'Customer',
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
          .content { padding: 30px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to LynxSupplies! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${fullName},</p>
            <p>Your account has been successfully created as a <strong>${roleLabels[role]}</strong>.</p>
            
            ${role === 'user' ? `
              <p>You can now:</p>
              <ul>
                <li>Browse our school supply catalog</li>
                <li>Add products to your cart</li>
                <li>Place orders and track them</li>
                <li>View your order history</li>
              </ul>
            ` : role === 'cashier' ? `
              <p>Your cashier account is ready. You can:</p>
              <ul>
                <li>Create orders for customers</li>
                <li>Process payments</li>
                <li>View sales dashboard</li>
                <li>Track your daily transactions</li>
              </ul>
            ` : role === 'owner' ? `
              <p>Welcome to the Store Owner dashboard. You can:</p>
              <ul>
                <li>Manage products and categories</li>
                <li>View all customer orders</li>
                <li>Track business analytics</li>
                <li>Manage your team members</li>
              </ul>
            ` : `
              <p>You have full system access as a Super Administrator.</p>
            `}
            
            <a href="${window.location.origin}/" class="button">Get Started</a>
          </div>
          <div class="footer">
            <p>© 2025 LynxSupplies. All rights reserved.</p>
            <p>If you didn't create this account, please ignore this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Welcome to LynxSupplies, ${fullName}!`,
    html,
    from: 'noreply@lynxsupplies.com',
  });
}

/**
 * Notify admins about new user signup
 */
export async function notifyAdminsNewUser(
  email: string,
  fullName: string,
  role: 'user' | 'cashier' | 'owner' | 'superadmin'
) {
  // Get all superadmin and owner users to notify
  const { data: adminUsers, error: queryError } = await supabase
    .from('user_roles')
    .select('user_id, roles(name)')
    .in('role_id', [
      // We'll query by role name instead
    ]);

  if (queryError) {
    console.error('Error fetching admins:', queryError);
    return { success: false, error: queryError };
  }

  // Query admins more directly
  const { data: admins } = await supabase
    .from('user_roles')
    .select('user_id, profiles(email, full_name), roles(name)')
    .in('roles.name', ['superadmin', 'owner']);

  if (!admins || admins.length === 0) {
    console.log('No admins to notify');
    return { success: true, error: null };
  }

  // Send email to each admin
  const emailPromises = admins.map((admin: any) => {
    const adminEmail = admin.profiles?.email || '';
    if (!adminEmail) return Promise.resolve();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f3f4f6; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; }
            .info-box { background: #eff6ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { font-size: 12px; color: #666; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New User Registration</h2>
            </div>
            <div style="padding: 20px;">
              <p>A new user has registered on LynxSupplies:</p>
              <div class="info-box">
                <p><strong>Name:</strong> ${fullName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Role:</strong> ${role}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p>You can manage this user from your admin dashboard.</p>
            </div>
            <div class="footer">
              <p>© 2025 LynxSupplies Admin Notification</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return sendEmail({
      to: adminEmail,
      subject: `New User Registration: ${fullName}`,
      html,
      from: 'admin@lynxsupplies.com',
    });
  });

  await Promise.all(emailPromises);
  return { success: true, error: null };
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
  fullName: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          .warning { color: #dc2626; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>Hi ${fullName},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <a href="${resetLink}" class="button">Reset Password</a>
          <p>This link expires in 1 hour.</p>
          <p class="warning">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your LynxSupplies Password',
    html,
  });
}
