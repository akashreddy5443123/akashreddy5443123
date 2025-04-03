import React, { useState, useEffect } from 'react'; // Import useState, useEffect
import { Routes, Route, Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { Calendar, Users, Search, Bell, ChevronRight } from 'lucide-react'; // Removed MessageSquare
import { Header } from './components/Header';
import { supabase } from './lib/supabase'; // Import supabase client
import { useAuthStore } from './stores/authStore'; // Import auth store
import { Events } from './pages/Events';
import { Clubs } from './pages/Clubs';
import { EventsAndClubs } from './pages/EventsAndClubs';
import { UserDashboard } from './pages/UserDashboard';
import { Announcements as AnnouncementsPage } from './pages/Announcements';
import { SearchPage } from './pages/SearchPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { ClubDetailPage } from './pages/ClubDetailPage'; // Import the club detail page

// Define Announcement type
interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

// Define Event type for featured events (adjust as needed based on your actual schema)
interface FeaturedEvent {
  id: string;
  title: string;
  date: string;
  image_url: string | null;
  club: { 
    name: string;
  }[] | null; 
  category?: string; // Add category if needed for filtering
}


function App() {
  const { user } = useAuthStore(); // Get user from auth store
  // State for announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  // State for featured events
  const [featuredEvents, setFeaturedEvents] = useState<FeaturedEvent[]>([]);
  const [loadingFeaturedEvents, setLoadingFeaturedEvents] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // State for search input
  const navigate = useNavigate(); // Hook for navigation

  // Fetch announcements and featured events on component mount
  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoadingAnnouncements(true);
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false }) // Get latest first
          .limit(3); // Limit to 3 for the homepage preview

        if (error) throw error;
        setAnnouncements(data || []);
      } catch (error) {
        console.error('Error fetching announcements:', error);
        // Handle error display if needed
      } finally {
        setLoadingAnnouncements(false);
      }
    };

    fetchAnnouncements();

    // Fetch featured events (now personalized)
    const fetchFeaturedEvents = async () => {
      setLoadingFeaturedEvents(true);
      let fetchedEvents: FeaturedEvent[] = [];
      try {
        const today = new Date().toISOString().split('T')[0]; 
        let userInterests: string[] | null = null;

        // 1. Check if user is logged in and fetch their interests (assuming 'interests' column exists)
        if (user?.id) {
           // We need the full profile data including interests from the store, 
           // or fetch it here if not available in the store's 'user' object.
           // Assuming user object in store has interests:
           // userInterests = user.interests; // Replace 'interests' with your actual column name

           // --- OR Fetch profile specifically for interests ---
           // This is safer if the store's user object might be stale or incomplete
           const { data: profileData, error: profileError } = await supabase
             .from('profiles')
             .select('interests') // Replace 'interests' with your actual column name
             .eq('id', user.id)
             .single();
           if (profileError) console.error("Error fetching profile interests:", profileError);
           // Ensure 'interests' exists and is an array before assigning
           if (profileData && Array.isArray(profileData.interests)) {
               userInterests = profileData.interests;
           }
           // --- End Fetch profile ---
        }

        // 2. Try fetching events based on interests (assuming 'category' column exists on events)
        if (userInterests && userInterests.length > 0) {
          console.log("Fetching events based on interests:", userInterests);
          const { data, error } = await supabase
            .from('events')
            .select(`
              id,
              title,
              date,
              image_url,
              category, 
              club:clubs ( name ) 
            `)
            .gte('date', today)
            .in('category', userInterests) // Filter by interests matching category
            .order('date', { ascending: true })
            .limit(3);
          
          if (error) throw error;
          if (data && data.length > 0) {
            fetchedEvents = data;
          } else {
             console.log("No events found matching interests.");
          }
        } else {
           console.log("No user interests found or user not logged in.");
        }

        // 3. Fallback: If no personalized events found, fetch the 3 most recent upcoming events
        if (fetchedEvents.length === 0) {
           console.log("Falling back to fetching latest upcoming events.");
           const { data, error } = await supabase
            .from('events')
            .select(`
              id,
              title,
              date,
              image_url,
              club:clubs ( name ) 
            `)
            .gte('date', today) 
            .order('date', { ascending: true }) 
            .limit(3);

           if (error) throw error;
           fetchedEvents = data || [];
        }

        setFeaturedEvents(fetchedEvents);

      } catch (error) {
        console.error('Error fetching featured events:', error);
        setFeaturedEvents([]); // Set to empty array on error
      } finally {
        setLoadingFeaturedEvents(false);
      }
    };

    fetchFeaturedEvents();

  }, [user?.id]); // Change dependency from [user] to [user?.id]


  // Remove the hardcoded featuredEvents array
  /*
  const featuredEvents = [
    {
      id: 1,
      title: "Spring Tech Hackathon",
      date: "March 15, 2024",
      club: "Computer Science Society",
      image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1000",
    },
    {
      id: 2,
      title: "Environmental Awareness Week",
      date: "March 20, 2024",
      club: "Green Earth Club",
      image: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=1000",
    },
    {
      id: 3,
      title: "Cultural Festival",
      date: "March 25, 2024",
      club: "International Students Association",
      image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1000",
    },
  ];
  */

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-center">
      <div className="min-h-screen bg-white/70"> {/* Changed from bg-white/95 to bg-white/70 for more visibility */}
      <Header />
      <Routes>
        <Route path="/" element={
          <>
            {/* Search Section */}
            <div className="bg-white/10 backdrop-blur-md py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="text-4xl font-bold mb-8 text-center text-white">
                    Discover Campus Life
                  </h2>
                  <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative">
                  <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search events, clubs, or activities..."
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/90 backdrop-blur-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  </form>
              </div>
            </div>

              {/* Quick Links - Added background opacity */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"> {/* Added padding */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Increased gap */}
                  <Link to="/events" className="bg-white/90 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 backdrop-blur-sm"> {/* Added bg-white/90 and backdrop-blur-sm */}
                  <Calendar className="h-8 w-8 text-indigo-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">Events Calendar</h3>
                  <p className="text-gray-600 mb-4">Browse and register for upcoming events</p>
                    <div className="text-indigo-600 font-medium flex items-center hover:text-indigo-800">
                    View Calendar <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </Link>
                  <Link to="/clubs" className="bg-white/90 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 backdrop-blur-sm"> {/* Added bg-white/90 and backdrop-blur-sm */}
                  <Users className="h-8 w-8 text-indigo-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">Clubs Directory</h3>
                  <p className="text-gray-600 mb-4">Explore and join student organizations</p>
                    <div className="text-indigo-600 font-medium flex items-center hover:text-indigo-800">
                    View Clubs <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </Link>
                  {/* Announcements Quick Link - Added background opacity */}
                  <Link to="/announcements" className="bg-white/90 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 backdrop-blur-sm"> {/* Added bg-white/90 and backdrop-blur-sm */}
                  <Bell className="h-8 w-8 text-indigo-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">Announcements</h3>
                  <p className="text-gray-600 mb-4">Stay updated with campus news</p>
                    <div className="text-indigo-600 font-medium flex items-center hover:text-indigo-800">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </Link>
                </div>
              </div>

              {/* Announcements Section - Display fetched data */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h2 className="text-2xl font-bold mb-8 text-gray-900">Latest Announcements</h2>
                {loadingAnnouncements ? (
                  <p>Loading announcements...</p> // Simple loading indicator
                ) : announcements.length > 0 ? (
                  <div className="space-y-6">
                    {announcements.map((announcement) => (
                       // Added background opacity to announcement cards
                      <div key={announcement.id} className="bg-white/90 p-6 rounded-lg shadow-md backdrop-blur-sm">
                        <h3 className="text-lg font-semibold mb-2 text-indigo-700">{announcement.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-gray-800">{announcement.content}</p>
                      </div>
                    ))}
                     {/* Link to view all announcements */}
                     <div className="text-center mt-8">
                       <Link to="/announcements" className="text-indigo-600 font-medium hover:text-indigo-800">
                         View All Announcements &rarr;
                       </Link>
                     </div>
                  </div>
                ) : (
                  <p className="text-gray-600">No announcements available at the moment.</p>
                )}
            </div>

              {/* Featured Events - Use dynamic data */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h2 className="text-2xl font-bold mb-8 text-gray-900">Featured Events</h2>
                {loadingFeaturedEvents ? (
                  <p>Loading featured events...</p>
                ) : featuredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredEvents.map((event) => (
                       // Added background opacity to event cards
                      <div key={event.id} className="bg-white/90 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 backdrop-blur-sm">
                        <img 
                          src={event.image_url || 'https://via.placeholder.com/400x200?text=No+Image'} // Use placeholder if no image
                          alt={event.title} 
                          className="w-full h-48 object-cover" 
                        />
                    <div className="p-6">
                          <h3 className="text-xl font-semibold mb-2 text-gray-900">{event.title}</h3>
                          <p className="text-gray-600 text-sm mb-1">{new Date(event.date).toLocaleDateString()}</p> {/* Format date */}
                          {/* Access club name from the first element of the array */}
                          <p className="text-indigo-600 text-sm mb-4">{event.club?.[0]?.name || 'Campus Event'}</p> 
                      <Link
                            to={`/events/${event.id}`} // Link to specific event page (assuming route exists)
                            className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 block text-center transition-colors duration-300 text-sm font-medium" 
                      >
                        Learn More
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
                ) : (
                   <p className="text-gray-600">No upcoming events featured at the moment.</p>
                )}
            </div>
          </>
        } />
          <Route path="/search" element={<SearchPage />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} /> {/* Add route for event detail */}
        <Route path="/clubs" element={<Clubs />} />
        <Route path="/clubs/:clubId" element={<ClubDetailPage />} /> {/* Add route for club detail */}
          <Route path="/announcements" element={<AnnouncementsPage />} /> {/* Add route for announcements */}
          <Route path="/search" element={<SearchPage />} /> {/* Add route for search results */}
        <Route path="/events-and-clubs" element={<EventsAndClubs />} />
          <Route path="/dashboard" element={<UserDashboard />} />
      </Routes> 
      </div>
    </div>
  );
}

export default App;
