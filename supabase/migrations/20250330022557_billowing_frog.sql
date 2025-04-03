/*
  # Add Profile Fields

  1. Changes
    - Add new fields to profiles table:
      - `date_of_birth` (date)
      - `avatar_url` (text)
      - `bio` (text)
      - `phone` (text)

  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS phone text;