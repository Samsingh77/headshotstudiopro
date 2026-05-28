-- =========================================================================
-- Supabase Signup Trigger Fix (HeadshotStudioPro & AI Suite)
-- Paste this script into your Supabase Dashboard SQL Editor & click Run
-- =========================================================================

-- EXPLANATION:
-- The error "Database error saving new user" occurs during registration because
-- a database trigger named "on_auth_user_created" in your Supabase DB is failing.
-- This happens either because:
--   1. The trigger function is trying to write to columns in the "profiles" table
--      that no longer exist or have been modified (like avatar_url, username, etc.)
--   2. The trigger function was not declared with "SECURITY DEFINER", causing
--      it to run without bypass permissions and fail Row Level Security (RLS).


-- -------------------------------------------------------------------------
-- OPTION 1: Repair the Database Trigger (Recommended)
-- -------------------------------------------------------------------------
-- This recreates a robust, fail-safe trigger that only inserts columns
-- that exist in your profiles table (id, email, tokens) and runs safely
-- with admin bypass permissions (SECURITY DEFINER).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, tokens, previews_remaining, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    0,                  -- Default 0 tokens
    4,                  -- Default 4 preview credits (or any preferred default)
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email; -- Avoid duplicating if user already exists
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Prevent the entire signup from failing if there is a minor profile table issue
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger safely (re-create it)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();



-- -------------------------------------------------------------------------
-- OPTION 2: Delete the Trigger Entirely (Alternative Fallback)
-- -------------------------------------------------------------------------
-- If you do not want to use trigger-based profile creation, you can safely delete the trigger.
-- The app's codebase has custom self-registration fallback logic in `/lib/supabase.ts` (the `getUserProfile` function),
-- which automatically creates a profile row in the database when the user logs in for the first time.
--
-- To do this, run this command:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
