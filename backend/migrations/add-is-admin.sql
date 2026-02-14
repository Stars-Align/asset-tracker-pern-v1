-- Add is_admin column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Optional: Create an index for faster lookups (good practice)
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
