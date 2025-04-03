// Use require for CommonJS modules in a .js file
const { createClient } = require('@supabase/supabase-js');

// WARNING: Never commit the Service Role Key to your repository!
// Use environment variables in a real application.
const SUPABASE_URL = 'https://iimtmshnsftaxydumfdg.supabase.co';
// Use the Service Role Key provided by the user
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpbXRtc2huc2Z0YXh5ZHVtZmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzI5OTM0MCwiZXhwIjoyMDU4ODc1MzQwfQ.MsZPzoEOMyEiLBpo9s0bsusPG2bILrKsAWURASJJZdY';

// Create a Supabase client with the Service Role Key
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedData() {
  console.log('Starting database seeding...');

  // --- Seed Clubs ---
  console.log('Seeding clubs...');
  const { data: clubs, error: clubError } = await supabaseAdmin
    .from('clubs')
    .insert([
      { name: 'Coding Club', description: 'For aspiring developers.', category: 'Academic', meeting_time: 'Wednesdays 6 PM', location: 'Tech Building Rm 101', email: 'coding@campus.edu', image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=60&w=800' },
      { name: 'Hiking Club', description: 'Explore local trails.', category: 'Recreation', meeting_time: 'Saturdays 9 AM', location: 'Student Union', email: 'hiking@campus.edu', image_url: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&q=60&w=800' },
      { name: 'Art Society', description: 'Create and appreciate art.', category: 'Arts', meeting_time: 'Tuesdays 7 PM', location: 'Fine Arts Center', email: 'art@campus.edu', image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=60&w=800' },
    ])
    .select(); // Select to get the IDs of inserted clubs

  if (clubError) {
    console.error('Error seeding clubs:', clubError);
    return;
  }
  console.log(`Seeded ${clubs?.length || 0} clubs.`);

  if (!clubs || clubs.length === 0) {
    console.error('No clubs were created, cannot seed events.');
    return;
  }

  // --- Seed Events ---
  console.log('Seeding events...');
  const codingClubId = clubs.find(c => c.name === 'Coding Club')?.id;
  const hikingClubId = clubs.find(c => c.name === 'Hiking Club')?.id;
  const artSocietyId = clubs.find(c => c.name === 'Art Society')?.id;

  if (!codingClubId || !hikingClubId || !artSocietyId) {
      console.error('Could not find IDs for all seeded clubs.');
      return;
  }

  const { error: eventError } = await supabaseAdmin
    .from('events')
    .insert([
      { title: 'Intro to React Workshop', description: 'Learn the basics of React.', date: '2025-04-10', time: '6:00 PM', location: 'Tech Building Rm 101', club_id: codingClubId, capacity: 30, image_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=60&w=800' },
      { title: 'Weekend Hike: Mountain View Trail', description: 'A scenic 5-mile hike.', date: '2025-04-13', time: '9:00 AM', location: 'Meet at Student Union', club_id: hikingClubId, capacity: 20, image_url: 'https://images.unsplash.com/photo-1458014871818-953559b9d9d1?auto=format&fit=crop&q=60&w=800' },
      { title: 'Guest Speaker: AI in Modern Development', description: 'Industry expert discusses AI trends.', date: '2025-04-17', time: '7:00 PM', location: 'Lecture Hall B', club_id: codingClubId, capacity: 100, image_url: 'https://images.unsplash.com/photo-1591696205602-2f950c417cb9?auto=format&fit=crop&q=60&w=800' },
      { title: 'Gallery Opening: Student Showcase', description: 'View works by fellow students.', date: '2025-04-19', time: '6:00 PM', location: 'Fine Arts Center Gallery', club_id: artSocietyId, capacity: 50, image_url: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&q=60&w=800' },
    ]);

  if (eventError) {
    console.error('Error seeding events:', eventError);
    return;
  }
  console.log('Seeded events.');

  console.log('Database seeding completed successfully!');
}

seedData().catch(console.error);
