/*
  # Add Sample Data

  1. Sample Data
    - Add sample clubs
    - Add sample events
    - Add RLS policies for viewing data
*/

-- Sample Clubs
INSERT INTO clubs (id, name, description, category, meeting_time, location, email, website, image_url)
VALUES
  (
    'c001b0d1-5f3d-4f3d-9c8a-c7d3c6d1f3d1',
    'Computer Science Society',
    'A community of tech enthusiasts exploring the latest in computer science and software development.',
    'Technology',
    'Every Tuesday at 5:00 PM',
    'Tech Building Room 101',
    'css@campus.edu',
    'https://css.campus.edu',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1000'
  ),
  (
    'c002b0d1-5f3d-4f3d-9c8a-c7d3c6d1f3d2',
    'Green Earth Club',
    'Dedicated to environmental conservation and sustainability initiatives on campus.',
    'Environment',
    'Every Wednesday at 4:00 PM',
    'Science Center Room 202',
    'green@campus.edu',
    'https://green.campus.edu',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=1000'
  ),
  (
    'c003b0d1-5f3d-4f3d-9c8a-c7d3c6d1f3d3',
    'International Students Association',
    'Bringing together students from around the world to share cultures and experiences.',
    'Cultural',
    'Every Friday at 6:00 PM',
    'Student Center Main Hall',
    'isa@campus.edu',
    'https://isa.campus.edu',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1000'
  );

-- Sample Events
INSERT INTO events (id, title, description, date, time, location, club_id, capacity, image_url)
VALUES
  (
    'e001b0d1-5f3d-4f3d-9c8a-c7d3c6d1f3d1',
    'Spring Tech Hackathon',
    'A 24-hour coding challenge to build innovative solutions for campus problems.',
    '2024-03-15',
    '09:00 AM',
    'Tech Building Main Hall',
    'c001b0d1-5f3d-4f3d-9c8a-c7d3c6d1f3d1',
    100,
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1000'
  ),
  (
    'e002b0d1-5f3d-4f3d-9c8a-c7d3c6d1f3d2',
    'Environmental Awareness Week',
    'A week-long series of workshops and activities focused on environmental conservation.',
    '2024-03-20',
    '10:00 AM',
    'Campus Green',
    'c002b0d1-5f3d-4f3d-9c8a-c7d3c6d1f3d2',
    200,
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=1000'
  ),
  (
    'e003b0d1-5f3d-4f3d-9c8a-c7d3c6d1f3d3',
    'Cultural Festival',
    'Annual celebration of diverse cultures featuring food, music, and performances.',
    '2024-03-25',
    '11:00 AM',
    'Student Center',
    'c003b0d1-5f3d-4f3d-9c8a-c7d3c6d1f3d3',
    500,
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1000'
  );