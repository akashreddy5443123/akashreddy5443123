import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Calendar, Users, Bell } from 'lucide-react';

// Define interfaces for search results (can reuse/adapt from other pages)
interface SearchEvent {
  id: string;
  title: string;
  date: string;
  description: string;
}

interface SearchClub {
  id: string;
  name: string;
  description: string;
}

interface SearchAnnouncement {
  id: string;
  title: string;
  message: string; // Changed content to message
  created_at: string;
}

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');

  const [events, setEvents] = useState<SearchEvent[]>([]);
  const [clubs, setClubs] = useState<SearchClub[]>([]);
  const [announcements, setAnnouncements] = useState<SearchAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performSearch = async () => {
      if (!query) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setEvents([]);
      setClubs([]);
      setAnnouncements([]);

      try {
        const searchTerm = `%${query}%`; // Prepare for ILIKE

        // Search Events (title or description)
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('id, title, date, description')
          .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(10); // Limit results per category
        if (eventsError) throw eventsError;
        setEvents(eventsData || []);

        // Search Clubs (name or description)
        const { data: clubsData, error: clubsError } = await supabase
          .from('clubs')
          .select('id, name, description')
          .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(10);
        if (clubsError) throw clubsError;
        setClubs(clubsData || []);

        // Search Announcements (title or message)
        const { data: announcementsData, error: announcementsError } = await supabase
          .from('announcements')
          .select('id, title, message, created_at') // Select message
          .or(`title.ilike.${searchTerm},message.ilike.${searchTerm}`) // Search message
          .order('created_at', { ascending: false })
          .limit(10);
        if (announcementsError) {
          console.error("Announcements search error:", announcementsError);
          // Optionally decide if one error should stop the whole search or just skip results
          // For now, let's continue but log the error
        } else {
          setAnnouncements(announcementsData || []);
        }

      } catch (err) {
        // This catch block might catch errors from any of the awaits above
        console.error("Overall search error:", err); 
        setError(err instanceof Error ? `Search failed: ${err.message}` : 'Failed to perform search');
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Search Results for: <span className="text-indigo-600">"{query}"</span>
      </h1>

      {loading && <p className="text-gray-500">Searching...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && (
        (events.length === 0 && clubs.length === 0 && announcements.length === 0) ? (
          <p className="text-gray-500">No results found.</p>
        ) : (
          <div className="space-y-10">
            {/* Event Results */}
            {events.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Calendar className="w-6 h-6 mr-2 text-indigo-600"/> Events
                </h2>
                <ul className="space-y-4">
                  {events.map(event => (
                    <li key={event.id} className="bg-white/90 p-4 rounded-lg shadow-md backdrop-blur-sm">
                      <Link to={`/events/${event.id}`} className="hover:text-indigo-700">
                        <h3 className="font-medium text-lg text-indigo-600">{event.title}</h3>
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">{new Date(event.date).toLocaleDateString()}</p>
                      <p className="text-gray-700 mt-2 text-sm line-clamp-2">{event.description}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Club Results */}
            {clubs.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                   <Users className="w-6 h-6 mr-2 text-indigo-600"/> Clubs
                </h2>
                 <ul className="space-y-4">
                  {clubs.map(club => (
                    <li key={club.id} className="bg-white/90 p-4 rounded-lg shadow-md backdrop-blur-sm">
                       <Link to={`/clubs`} className="hover:text-indigo-700"> {/* Link to general clubs page for now */}
                        <h3 className="font-medium text-lg text-indigo-600">{club.name}</h3>
                      </Link>
                      <p className="text-gray-700 mt-2 text-sm line-clamp-2">{club.description}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

             {/* Announcement Results */}
            {announcements.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                   <Bell className="w-6 h-6 mr-2 text-indigo-600"/> Announcements
                </h2>
                 <ul className="space-y-4">
                  {announcements.map(announcement => (
                    <li key={announcement.id} className="bg-white/90 p-4 rounded-lg shadow-md backdrop-blur-sm">
                       <Link to={`/announcements`} className="hover:text-indigo-700"> {/* Link to general announcements page */}
                         <h3 className="font-medium text-lg text-indigo-600">{announcement.title}</h3>
                       </Link>
                       <p className="text-sm text-gray-500 mt-1">{new Date(announcement.created_at).toLocaleString()}</p>
                       <p className="text-gray-700 mt-2 text-sm line-clamp-3">{announcement.message}</p> {/* Display message */}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )
      )}
    </div>
  );
}
