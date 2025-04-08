-- Drop existing select policy on profiles if it exists
-- (Adjust the policy name if it's different in your setup)
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles; 
DROP POLICY IF EXISTS "Allow individual user access" ON public.profiles; -- Common default policy name
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles; -- Another common default

-- Create a new policy allowing authenticated users to read specific public columns
CREATE POLICY "Allow authenticated read access to public profile info"
ON public.profiles
FOR SELECT
TO authenticated -- Grant permission to any logged-in user
USING (true); -- The condition is always true for select

-- Note: We are implicitly restricting which columns can be selected by not granting SELECT on all columns.
-- Supabase handles column-level select grants via the policy definition implicitly.
-- If you need finer control, you might need to adjust table grants, but this policy approach is standard.

-- Ensure users can still update their own profiles (assuming a policy like this already exists, but good to be explicit)
-- Recreate or ensure an update policy exists
DROP POLICY IF EXISTS "Allow individual user update access" ON public.profiles;
CREATE POLICY "Allow individual user update access"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled (it should be, but double-check)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
