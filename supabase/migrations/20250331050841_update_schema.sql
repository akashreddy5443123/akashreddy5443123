-- Add missing columns to profiles table
ALTER TABLE profiles
ADD COLUMN date_of_birth date,
ADD COLUMN phone text,
ADD COLUMN bio text;

-- Create announcements table
CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) -- Assuming announcements are created by users/admins
);

-- Enable RLS for announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Policies for announcements
-- Allow authenticated users to read all announcements
CREATE POLICY "Authenticated users can read announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (true);

-- Allow users (or specific roles later) to create announcements
-- For now, let's allow any authenticated user to create
CREATE POLICY "Authenticated users can create announcements"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Allow creators to update their own announcements
CREATE POLICY "Creators can update their own announcements"
  ON announcements FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Allow creators to delete their own announcements
CREATE POLICY "Creators can delete their own announcements"
  ON announcements FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Update RLS policy for profiles to allow reading new columns
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Update RLS policy for profiles to allow updating new columns
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id); -- Add WITH CHECK for update
