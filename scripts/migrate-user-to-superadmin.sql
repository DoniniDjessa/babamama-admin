-- Script to migrate existing user to ali-users as superadmin
-- Run this in Supabase SQL Editor after creating ali-users table

-- Step 1: Get the first user from auth.users
DO $$
DECLARE
  user_id_var uuid;
  user_email_var text;
  user_metadata_var jsonb;
BEGIN
  -- Get the first user (oldest)
  SELECT id, email, raw_user_meta_data 
  INTO user_id_var, user_email_var, user_metadata_var
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1;

  -- Insert into ali-users as superadmin
  INSERT INTO public."ali-users" (
    id,
    full_name,
    email,
    phone,
    role,
    is_employee,
    is_active
  )
  VALUES (
    user_id_var,
    COALESCE(user_metadata_var->>'full_name', user_email_var, 'Super Admin'),
    user_email_var,
    COALESCE(user_metadata_var->>'phone', NULL),
    'super_admin',
    true,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    is_employee = true,
    is_active = true;

  -- Also add to ali-customers if not exists
  INSERT INTO public."ali-customers" (
    id,
    full_name,
    email,
    phone
  )
  VALUES (
    user_id_var,
    COALESCE(user_metadata_var->>'full_name', user_email_var, 'Customer'),
    user_email_var,
    COALESCE(user_metadata_var->>'phone', NULL)
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'User migrated successfully!';
  RAISE NOTICE 'User ID: %', user_id_var;
  RAISE NOTICE 'User Email: %', user_email_var;
END $$;

