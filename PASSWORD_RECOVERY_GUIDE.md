# Password Recovery Flow Documentation

## Overview
The password recovery system allows users to securely reset their password via email. The flow uses Supabase Auth's built-in password recovery functionality with email verification links.

## ⚠️ IMPORTANT: Supabase Email Provider Setup Required

**Before using password recovery, you MUST configure an email provider in Supabase:**

### Setup Steps:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Enable **Email** provider
5. For production, go to **Project Settings** → **Email Provider**
   - Select SendGrid, Mailgun, or AWS SES
   - Add your provider credentials
6. Test the recovery flow in `/auth/forgot-password`

### Why This is Needed:
- Default Supabase email service has rate limits (20 emails/hour)
- Production apps need a dedicated email provider
- Without configuration, you'll get a 500 error when trying to send recovery emails

## Components & Pages

### 1. ForgotPasswordPage (`/auth/forgot-password`)
- **Purpose**: Initial password recovery request
- **Flow**:
  - User enters their email address
  - System sends recovery email via Supabase
  - User sees confirmation message
  - Recovery link is valid for 24 hours
- **Features**:
  - Email validation
  - User-friendly confirmation
  - Link to return to login
  - Animated UI with mail icon illustrations

### 2. ResetPasswordPage (`/auth/reset-password`)
- **Purpose**: Password reset after clicking email link
- **Flow**:
  - User clicks link from recovery email (redirects here)
  - System verifies the recovery token
  - User enters new password
  - Password is updated in Supabase
  - User is automatically logged in
  - Redirects to login page
- **Features**:
  - Token verification on mount
  - Expired link handling
  - Password confirmation matching
  - Success confirmation with auto-redirect
  - Animated UI with lock/shield illustrations

## URL Configuration

### Supabase Email Template Configuration
In your Supabase project settings, the recovery email link is automatically generated with format:
```
https://yourapp.com/auth/reset-password?token=xxxxx&type=recovery
```

**Current Configuration:**
- Recovery redirect URL: `https://lynxschoolsupply.netlify.app/auth/reset-password`
- Token type: `recovery` (automatically handled by Supabase)
- Token validity: 24 hours (configurable in Supabase settings)

## Service Functions

### `password-recovery.service.ts`

#### `sendPasswordRecoveryEmail(email: string)`
Sends a password recovery email to the user.
```typescript
const { error, message } = await sendPasswordRecoveryEmail('user@example.com');
if (error) {
  console.error('Error:', error.message);
} else {
  console.log(message); // "Recovery email sent successfully. Check your inbox."
}
```

#### `updatePasswordWithSession(newPassword: string)`
Updates the user's password using the active recovery session.
```typescript
const { error } = await updatePasswordWithSession('newPassword123');
if (error) {
  console.error('Error:', error.message);
}
```

#### `verifyPasswordResetToken()`
Verifies if the current recovery token is valid.
```typescript
const { isValid, error } = await verifyPasswordResetToken();
if (!isValid) {
  console.log('Recovery link expired:', error);
}
```

## Security Features

✅ **Email Verification**: Only users with access to registered email can reset password
✅ **Token Expiry**: Recovery links expire after 24 hours
✅ **Session-Based**: Password reset requires valid recovery session
✅ **Password Hashing**: All passwords are securely hashed by Supabase
✅ **HTTPS Only**: All communication is encrypted
✅ **Rate Limiting**: Supabase handles rate limiting on recovery emails

## User Flow Diagram

```
User clicks "Forgot Password?" on Login Page
         ↓
ForgotPasswordPage
  - Enter email address
  - Click "Send Recovery Link"
         ↓
Supabase sends email with recovery link
         ↓
User clicks link in email
         ↓
Browser redirects to: /auth/reset-password?token=xxxxx&type=recovery
         ↓
ResetPasswordPage loads
  - Verifies token is valid
  - Shows password reset form if valid
         ↓
User enters new password
  - Click "Reset Password"
         ↓
updatePasswordWithSession() called
  - Password updated in Supabase
  - Recovery session validated
         ↓
Success message shows
  - Automatically redirects to /auth/login after 3 seconds
         ↓
User logs in with new password
```

## Customization

### Change Recovery Link Redirect URL
Update in both files:
1. **password-recovery.service.ts**: Line 24
2. **ResetPasswordPage.tsx**: Already correctly configured

### Change Token Expiry Time
Go to Supabase Dashboard → Authentication → Email Templates
- Edit "Reset Password" email template
- Token validity is set in Supabase project settings (default: 24 hours)

### Add Additional Validation
Edit `resetPasswordSchema` in `password-recovery.service.ts`:
```typescript
export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
```

## Testing

### Test Password Recovery Flow
1. Go to `/auth/forgot-password`
2. Enter your test email
3. Check your email inbox (or spam folder)
4. Click the recovery link
5. You should be redirected to `/auth/reset-password`
6. Enter a new password
7. After success, you'll be redirected to login
8. Log in with your new password

### Test Invalid/Expired Token
1. Manually navigate to `/auth/reset-password`
2. You should see "Recovery Link Expired" message
3. Click "Request New Link" to go back to forgot password

## Database Considerations

The password recovery system is entirely handled by Supabase Auth. No custom database operations are needed for:
- Storing recovery tokens
- Managing token expiry
- Updating passwords

All security-sensitive operations are handled server-side by Supabase.

## Troubleshooting

### "Email service is not configured" or 500 Error

**Root Cause**: The Supabase email provider is not set up in your project.

**Solution**:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication** → **Email Templates**
3. You should see the "Reset Password" template
4. Go to **Authentication** → **Providers**
5. Ensure **Email** provider is enabled
6. For production, configure an external email provider:
   - Go to **Project Settings** → **Email Provider**
   - Choose: SendGrid, Mailgun, or AWS SES
   - Add credentials for your selected provider
7. Test the recovery flow again

**Temporary Workaround** (Development):
- Use Supabase's default email provider (limited to 20 emails/hour)
- Emails may take 1-2 minutes to arrive
- Check spam/junk folder

### Recovery email not received
1. Check spam/junk folder
2. Verify email address is correct
3. Wait a few moments (SMTP delivery can take time)
4. Request a new recovery link
5. Verify your email provider is configured in Supabase

### "Invalid or expired recovery link" error
1. Recovery link expires after 24 hours
2. Request a new recovery link
3. Make sure you're using the exact link from email

### Can't log in after reset
1. Make sure you're using your new password
2. Clear browser cache
3. Try in incognito/private window
4. Verify the email address used matches your account

## Related Files
- `/src/features/auth/pages/LoginPage.tsx` - Links to forgot password
- `/src/features/auth/pages/ForgotPasswordPage.tsx` - Password recovery request
- `/src/features/auth/pages/ResetPasswordPage.tsx` - Password reset form
- `/src/features/auth/services/password-recovery.service.ts` - Recovery logic
- `/src/App.tsx` - Route configuration
