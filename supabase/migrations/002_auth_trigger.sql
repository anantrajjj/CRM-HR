-- ============================================================
-- Database Trigger for Auto-creating User Records
-- ============================================================

-- This function runs when a new user signs up via OAuth or email
-- It automatically creates a record in the users table

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that runs after a new user is created in auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RLS Policies for users table
-- ============================================================

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to read all users (for admin/manager views)
CREATE POLICY "Authenticated users can view all users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- Instructions for Google OAuth Setup in Supabase
-- ============================================================

-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project
-- 3. Go to Authentication > Providers
-- 4. Enable Google provider
-- 5. Enter your Google OAuth credentials:
--    - Client ID: Get from Google Cloud Console
--    - Client Secret: Get from Google Cloud Console
-- 6. Set the Authorized Redirect URI to:
--    https://wktqjajlvmpjzbuvvlwj.supabase.co/auth/v1/callback
-- 
-- To get Google OAuth credentials:
-- 1. Go to https://console.cloud.google.com
-- 2. Create a new project or select existing
-- 3. Go to APIs & Services > Credentials
-- 4. Create OAuth 2.0 Client ID
-- 5. Set Application type to "Web application"
-- 6. Add authorized redirect URIs
-- 7. Copy the Client ID and Client Secret
