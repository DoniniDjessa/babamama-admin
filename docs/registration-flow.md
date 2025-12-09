# Registration Flow Setup

This document describes the complete registration and authentication flow for the admin application.

## Overview

The registration flow includes:
1. User registration with email/phone
2. Automatic admin profile creation
3. Email confirmation (if enabled)
4. Protected routes via middleware
5. Auth callback handling

## Database Setup

### 1. Run the Migration

Execute the SQL migration file to create the admin users table:

```sql
-- File: supabase/migrations/001_create_admin_users.sql
```

This creates:
- `ali-admins` table to store admin user profiles
- Automatic trigger to create admin record on user signup
- RLS policies for security

### 2. Supabase Configuration

In your Supabase dashboard:

1. **Authentication Settings**:
   - Go to Authentication > Settings
   - Configure email confirmation (optional but recommended)
   - Set up email templates if needed

2. **Email Templates**:
   - Customize the confirmation email template
   - Update the redirect URL to: `{YOUR_APP_URL}/auth/callback?next=/`

3. **Environment Variables**:
   Make sure your `.env.local` has:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Registration Flow

### Step 1: User Registration
- User fills out registration form (`/register`)
- Can register with either email or phone number
- Form validates all fields

### Step 2: Account Creation
- Supabase creates auth user
- Trigger automatically creates `ali-admins` record
- User metadata (full_name, phone) is stored

### Step 3: Email Confirmation (if enabled)
- User receives confirmation email
- Clicks link → redirected to `/auth/callback`
- Callback exchanges code for session
- User is redirected to dashboard

### Step 4: Direct Login (if email confirmation disabled)
- User is immediately logged in
- Redirected to dashboard (`/`)

## Authentication Flow

### Login
- User enters email/phone and password
- Supabase authenticates user
- Session is created
- User redirected to dashboard

### Protected Routes
- Middleware checks authentication on all routes
- Unauthenticated users → redirected to `/login`
- Authenticated users on auth pages → redirected to `/`

## Files Structure

```
app/
  ├── page.tsx              # Dashboard (protected)
  ├── login/
  │   └── page.tsx          # Login page
  ├── register/
  │   └── page.tsx          # Registration page
  └── auth/
      └── callback/
          └── route.ts      # Auth callback handler

middleware.ts               # Route protection
lib/
  ├── supabase/
  │   ├── client.ts        # Browser client
  │   └── server.ts        # Server client
  └── auth.ts              # Auth utilities

supabase/
  └── migrations/
      └── 001_create_admin_users.sql
```

## Testing the Flow

1. **Register a new user**:
   - Go to `/register`
   - Fill in the form
   - Submit

2. **Check email** (if confirmation enabled):
   - Check inbox for confirmation email
   - Click confirmation link

3. **Login**:
   - Go to `/login`
   - Enter credentials
   - Should redirect to dashboard

4. **Access protected routes**:
   - Try accessing `/` without login → should redirect to `/login`
   - After login → should access dashboard

## Troubleshooting

### Registration button does nothing
- Check browser console for validation errors
- Ensure all required fields are filled
- Check Supabase connection

### Email confirmation not working
- Verify email template redirect URL
- Check Supabase email settings
- Ensure SMTP is configured (if using custom SMTP)

### Middleware redirects not working
- Clear browser cookies
- Check middleware.ts configuration
- Verify Supabase environment variables

### Admin profile not created
- Check database trigger is active
- Verify `ali-admins` table exists
- Check Supabase logs for errors

