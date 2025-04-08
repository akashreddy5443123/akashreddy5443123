-- Enable Row Level Security for the club_members table
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow users to select their own club memberships
CREATE POLICY select_own_memberships ON public.club_members
FOR SELECT
USING (user_id = (select auth.uid()));

-- Create a policy to allow users to insert their own memberships
CREATE POLICY insert_own_memberships ON public.club_members
FOR INSERT
WITH CHECK (user_id = (select auth.uid()));
