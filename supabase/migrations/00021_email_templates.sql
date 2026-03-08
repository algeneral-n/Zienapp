-- ============================================================================
-- Migration 00021: Custom Email Templates for ZIEN Platform
-- Replaces default Supabase branding with ZIEN branding.
--
-- NOTE: Email templates are normally configured in Supabase Dashboard → 
-- Authentication → Email Templates. This migration updates the config 
-- table directly for deployment automation.
--
-- IMPORTANT: After deploying, verify templates in the Supabase Dashboard.
-- ============================================================================

-- Unfortunately, Supabase does not expose email template configuration
-- through SQL migrations. Email templates must be configured via:
--
-- 1. Supabase Dashboard → Authentication → Email Templates
-- 2. Supabase CLI config.toml
--
-- Below are the recommended templates to paste into the dashboard.
-- The migration creates a helper table to store the templates for reference.

CREATE TABLE IF NOT EXISTS public.email_template_config (
  id text PRIMARY KEY,
  subject text NOT NULL,
  html_body text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Store the ZIEN-branded email templates as reference data
INSERT INTO public.email_template_config (id, subject, html_body) VALUES

('confirm_signup', 'مرحباً بك في ZIEN Platform - تأكيد البريد الإلكتروني | Welcome to ZIEN Platform', '
<!DOCTYPE html>
<html dir="auto">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #2563eb, #06b6d4); padding: 32px 24px; text-align: center; }
    .header img { height: 48px; margin-bottom: 16px; }
    .header h1 { color: #ffffff; font-size: 22px; margin: 0; }
    .body { padding: 32px 24px; color: #374151; line-height: 1.6; }
    .btn { display: inline-block; padding: 14px 32px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; margin: 24px 0; }
    .footer { padding: 24px; text-align: center; background: #f9fafb; color: #9ca3af; font-size: 12px; }
    .footer a { color: #2563eb; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://plt.zien-ai.app/zien-logo.png" alt="ZIEN Platform" />
      <h1>ZIEN Platform</h1>
    </div>
    <div class="body">
      <h2>مرحباً بك! | Welcome!</h2>
      <p>شكراً لتسجيلك في ZIEN Platform. يرجى تأكيد بريدك الإلكتروني بالنقر على الزر أدناه.</p>
      <p>Thank you for signing up for ZIEN Platform. Please confirm your email by clicking the button below.</p>
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="btn">تأكيد البريد الإلكتروني | Confirm Email</a>
      </div>
      <p style="color: #9ca3af; font-size: 13px;">إذا لم تقم بإنشاء هذا الحساب، يمكنك تجاهل هذا البريد.</p>
      <p style="color: #9ca3af; font-size: 13px;">If you did not create this account, you can ignore this email.</p>
    </div>
    <div class="footer">
      <p>ZIEN Platform — Smart Business Management</p>
      <p><a href="https://plt.zien-ai.app">plt.zien-ai.app</a> | <a href="mailto:support@zien-ai.app">support@zien-ai.app</a></p>
      <p>&copy; 2026 ZIEN Technologies. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
'),

('reset_password', 'إعادة تعيين كلمة المرور | ZIEN Platform Password Reset', '
<!DOCTYPE html>
<html dir="auto">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #2563eb, #06b6d4); padding: 32px 24px; text-align: center; }
    .header img { height: 48px; margin-bottom: 16px; }
    .header h1 { color: #ffffff; font-size: 22px; margin: 0; }
    .body { padding: 32px 24px; color: #374151; line-height: 1.6; }
    .btn { display: inline-block; padding: 14px 32px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; margin: 24px 0; }
    .footer { padding: 24px; text-align: center; background: #f9fafb; color: #9ca3af; font-size: 12px; }
    .footer a { color: #2563eb; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://plt.zien-ai.app/zien-logo.png" alt="ZIEN Platform" />
      <h1>ZIEN Platform</h1>
    </div>
    <div class="body">
      <h2>إعادة تعيين كلمة المرور | Password Reset</h2>
      <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة.</p>
      <p>We received a request to reset your password. Click the button below to create a new password.</p>
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="btn">إعادة تعيين | Reset Password</a>
      </div>
      <p style="color: #9ca3af; font-size: 13px;">إذا لم تطلب إعادة التعيين، يمكنك تجاهل هذا البريد. كلمة المرور لن تتغير.</p>
      <p style="color: #9ca3af; font-size: 13px;">If you did not request this reset, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>ZIEN Platform — Smart Business Management</p>
      <p><a href="https://plt.zien-ai.app">plt.zien-ai.app</a> | <a href="mailto:support@zien-ai.app">support@zien-ai.app</a></p>
      <p>&copy; 2026 ZIEN Technologies. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
'),

('invite_user', 'دعوة للانضمام إلى ZIEN Platform | Invitation to Join', '
<!DOCTYPE html>
<html dir="auto">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #2563eb, #06b6d4); padding: 32px 24px; text-align: center; }
    .header img { height: 48px; margin-bottom: 16px; }
    .header h1 { color: #ffffff; font-size: 22px; margin: 0; }
    .body { padding: 32px 24px; color: #374151; line-height: 1.6; }
    .btn { display: inline-block; padding: 14px 32px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; margin: 24px 0; }
    .footer { padding: 24px; text-align: center; background: #f9fafb; color: #9ca3af; font-size: 12px; }
    .footer a { color: #2563eb; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://plt.zien-ai.app/zien-logo.png" alt="ZIEN Platform" />
      <h1>ZIEN Platform</h1>
    </div>
    <div class="body">
      <h2>لقد تمت دعوتك! | You''ve Been Invited!</h2>
      <p>تمت دعوتك للانضمام إلى فريق في ZIEN Platform. انقر على الزر أدناه لقبول الدعوة وإعداد حسابك.</p>
      <p>You have been invited to join a team on ZIEN Platform. Click the button below to accept the invitation and set up your account.</p>
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="btn">قبول الدعوة | Accept Invitation</a>
      </div>
    </div>
    <div class="footer">
      <p>ZIEN Platform — Smart Business Management</p>
      <p><a href="https://plt.zien-ai.app">plt.zien-ai.app</a> | <a href="mailto:support@zien-ai.app">support@zien-ai.app</a></p>
      <p>&copy; 2026 ZIEN Technologies. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
'),

('magic_link', 'رابط تسجيل الدخول | ZIEN Platform Login Link', '
<!DOCTYPE html>
<html dir="auto">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #2563eb, #06b6d4); padding: 32px 24px; text-align: center; }
    .header img { height: 48px; margin-bottom: 16px; }
    .header h1 { color: #ffffff; font-size: 22px; margin: 0; }
    .body { padding: 32px 24px; color: #374151; line-height: 1.6; }
    .btn { display: inline-block; padding: 14px 32px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; margin: 24px 0; }
    .footer { padding: 24px; text-align: center; background: #f9fafb; color: #9ca3af; font-size: 12px; }
    .footer a { color: #2563eb; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://plt.zien-ai.app/zien-logo.png" alt="ZIEN Platform" />
      <h1>ZIEN Platform</h1>
    </div>
    <div class="body">
      <h2>رابط تسجيل الدخول | Login Link</h2>
      <p>انقر على الزر أدناه لتسجيل الدخول إلى حسابك في ZIEN Platform.</p>
      <p>Click the button below to log in to your ZIEN Platform account.</p>
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="btn">تسجيل الدخول | Log In</a>
      </div>
      <p style="color: #9ca3af; font-size: 13px;">هذا الرابط صالح لمرة واحدة فقط وينتهي بعد 24 ساعة.</p>
      <p style="color: #9ca3af; font-size: 13px;">This link is valid for single use and expires in 24 hours.</p>
    </div>
    <div class="footer">
      <p>ZIEN Platform — Smart Business Management</p>
      <p><a href="https://plt.zien-ai.app">plt.zien-ai.app</a> | <a href="mailto:support@zien-ai.app">support@zien-ai.app</a></p>
      <p>&copy; 2026 ZIEN Technologies. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
')

ON CONFLICT (id) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  updated_at = now();

-- INSTRUCTIONS FOR SUPABASE DASHBOARD:
-- =====================================
-- 1. Go to: Supabase Dashboard → Authentication → Email Templates
-- 2. For each template type (Confirm signup, Reset password, Invite user, Magic Link):
--    a. Copy the subject from: SELECT subject FROM email_template_config WHERE id = '<type>';
--    b. Copy the html_body from: SELECT html_body FROM email_template_config WHERE id = '<type>';
--    c. Paste into the corresponding template in the dashboard
-- 3. Save changes
--
-- Alternatively, configure SMTP settings:
-- Dashboard → Settings → Auth → SMTP Settings
-- - SMTP Host: (your Resend/SendGrid/SES host)
-- - SMTP Port: 465 (SSL) or 587 (TLS)
-- - Sender name: ZIEN Platform
-- - Sender email: noreply@zien-ai.app
