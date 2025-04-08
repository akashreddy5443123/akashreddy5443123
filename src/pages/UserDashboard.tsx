import React, { useState, useEffect } from 'react'; // Keep single correct import
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { X, Trash2, Pencil } from 'lucide-react'; // Removed Edit icon
import { EditEventModal } from '../components/EditEventModal'; // Import modals
import { EditClubModal } from '../components/EditClubModal';

// Types for the data displayed on the dashboard
interface UserEvent {
  id: string;
  title: string;
  date: string;
  location: string;
}

interface UserClub {
  id: string;
  name: string;
  joined_at: string; // Assuming this comes from club_memberships
}

// Type for created items
interface CreatedItem {
  id: string;
  name: string; // Use 'name' for clubs, 'title' for events
  type: 'event' | 'club';
  // Add fields needed by modals if different from UserEvent/UserClub
  description?: string;
  date?: string;
  time?: string;
  location?: string;
  club_id?: string | null;
  capacity?: number;
  image_url?: string;
  category?: string;
  meeting_time?: string;
  email?: string;
  website?: string;
  created_by?: string; // Ensure this is fetched if not already
}


// Corrected types for the raw data structure from Supabase queries
// Assuming Supabase might return joined relations as arrays
interface RawEventRegistrationSelect {
  event: {
    id: string;
    title: string;
    date: string;
    location: string;
  }[] | null; // Expecting array or null
}

interface RawClubMembershipSelect {
  club: {
    id: string;
    name: string;
  }[] | null; // Expecting array or null
  joined_at: string;
}


export function UserDashboard() {
  const { user } = useAuthStore();
  const [registeredEvents, setRegisteredEvents] = useState<UserEvent[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<UserClub[]>([]);
  const [createdItems, setCreatedItems] = useState<CreatedItem[]>([]); // Combined list for created items
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [isEditClubModalOpen, setIsEditClubModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CreatedItem | null>(null);
  const navigate = useNavigate(); // Use navigate if needed

  // Function to fetch user data (events and clubs)
  async function fetchUserData() {
      if (!user) {
        setLoading(false);
        setRegisteredEvents([]);
        setJoinedClubs([]);
        setCreatedItems([]); // Reset created items
        return;
      }
      setLoading(true);
      try {
        // Fetch user's registered events
        const { data: eventsData, error: eventsError } = await supabase
          .from('event_registrations')
          .select(`
            event:events (
              id,
              title,
              date,
              location
            )
          `)
          .eq('user_id', user.id);
        if (eventsError) throw eventsError;

        // Fetch user's joined clubs
        const { data: joinedClubsData, error: joinedClubsError } = await supabase
          .from('club_memberships')
          .select(`
            club:clubs (
              id,
              name
            ),
            joined_at
          `)
          .eq('user_id', user.id);
        if (joinedClubsError) throw joinedClubsError;

        // Fetch user's created events (select fields needed for editing)
        const { data: createdEventsData, error: createdEventsError } = await supabase
          .from('events')
          .select('*, created_by, club_id') // Select all needed fields
          .eq('created_by', user.id);
        if (createdEventsError) throw createdEventsError;

        // Fetch user's created clubs (select fields needed for editing)
        const { data: createdClubsData, error: createdClubsError } = await supabase
          .from('clubs')
          .select('*, created_by') // Select all needed fields
          .eq('created_by', user.id);
        if (createdClubsError) throw createdClubsError;


        // --- Map Data ---
        const mappedRegisteredEvents = (eventsData as RawEventRegistrationSelect[] | null || [])
          .map(d => d.event?.[0])
          .filter((event): event is UserEvent => !!event);

        const mappedJoinedClubs = (joinedClubsData as RawClubMembershipSelect[] | null || [])
          .map(d => d.club?.[0] ? { ...d.club[0], joined_at: d.joined_at } : null)
          .filter((club): club is UserClub => !!club);

        // Map created items, ensuring all necessary fields are included for editing
        const mappedCreatedEvents = (createdEventsData || []).map(e => ({ ...e, name: e.title, type: 'event' as const }));
        const mappedCreatedClubs = (createdClubsData || []).map(c => ({ ...c, type: 'club' as const }));

        setRegisteredEvents(mappedRegisteredEvents);
        setJoinedClubs(mappedJoinedClubs);
        setCreatedItems([...mappedCreatedEvents, ...mappedCreatedClubs]); // Combine created items

      } catch (error) {
        console.error('Error fetching user data:', error);
        setRegisteredEvents([]);
        setJoinedClubs([]);
        setCreatedItems([]);
      } finally {
        setLoading(false);
      }
    }

  useEffect(() => {
    fetchUserData();
  }, [user]);

  // Handle Event Unregister
  const handleUnregister = async (eventId: string) => {
    if (!user) return;
    setActionLoadingId(eventId);
    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);
      if (error) throw error;
      setRegisteredEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (err) {
      console.error("Error unregistering from event:", err);
      alert(err instanceof Error ? err.message : 'Failed to unregister');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Leave Club
  const handleLeave = async (clubId: string) => {
     if (!user) return;
     setActionLoadingId(clubId);
     try {
       const { error } = await supabase
         .from('club_memberships')
         .delete()
         .eq('club_id', clubId)
         .eq('user_id', user.id);
      if (error) throw error;
       setJoinedClubs(prev => prev.filter(club => club.id !== clubId));
     } catch (err) {
       console.error("Error leaving club:", err);
       alert(err instanceof Error ? err.message : 'Failed to leave club');
     } finally {
       setActionLoadingId(null);
     }
  };

  // Handle Delete Created Item
  const handleDeleteItem = async (item: CreatedItem) => {
      if (!user) return;
      const itemType = item.type;
      const itemId = item.id;
      const confirmMessage = `Are you sure you want to delete this ${itemType}? This may also delete associated data (like event registrations or events for a club) and cannot be undone.`;

      if (!window.confirm(confirmMessage)) return;

      setActionLoadingId(`${itemType}-${itemId}`); // Unique loading ID
      try {
          const tableName = itemType === 'event' ? 'events' : 'clubs';
          const { error } = await supabase
              .from(tableName)
              .delete()
              .eq('id', itemId);

          if (error) throw error;

          // Refetch all dashboard data after successful delete
          await fetchUserData();

      } catch (err) {
          console.error(`Error deleting ${itemType}:`, err);
          alert(err instanceof Error ? err.message : `Failed to delete ${itemType}`);
      } finally {
          setActionLoadingId(null);
      }
  };

  // Handle Opening Edit Modals
  const openEditItemModal = (item: CreatedItem) => {
      setEditingItem(item);
      if (item.type === 'event') {
          setIsEditEventModalOpen(true);
      } else {
          setIsEditClubModalOpen(true);
      }
  };


  return (
    <div className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-center">
      <div className="min-h-screen bg-white/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Dashboard</h1> 

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8"> 
            {/* Your Registered Events */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Registered Events</h2>
              {loading ? (
                 <p className="text-gray-500">Loading events...</p>
              ) : registeredEvents.length > 0 ? (
                <ul className="space-y-3">
                  {registeredEvents.map(event => (
                    <li key={event.id} className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-b-0">
                      <div>
                        <Link to={`/events/${event.id}`} className="font-medium text-indigo-700 hover:underline">{event.title}</Link>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(event.date).toLocaleDateString()} - {event.location}
                        </p>
                      </div>
                      <button
                        onClick={() => handleUnregister(event.id)}
                        disabled={actionLoadingId === event.id}
                        className={`ml-4 px-3 py-1 text-xs rounded ${
                          actionLoadingId === event.id 
                            ? 'bg-red-300 text-red-700 cursor-not-allowed' 
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {actionLoadingId === event.id ? '...' : 'Unregister'}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">You haven't registered for any events yet.</p>
              )}
            </div>

            {/* Your Joined Clubs */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Joined Clubs</h2>
              {loading ? (
                 <p className="text-gray-500">Loading clubs...</p>
              ) : joinedClubs.length > 0 ? (
                <ul className="space-y-3">
                  {joinedClubs.map(club => (
                    <li key={club.id} className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-b-0">
                      <div>
                        <Link to={`/clubs/${club.id}`} className="font-medium text-indigo-700 hover:underline">{club.name}</Link>
                        <p className="text-sm text-gray-500 mt-1">
                          Joined: {new Date(club.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                       <button
                        onClick={() => handleLeave(club.id)}
                        disabled={actionLoadingId === club.id}
                        className={`ml-4 px-3 py-1 text-xs rounded ${
                          actionLoadingId === club.id 
                            ? 'bg-red-300 text-red-700 cursor-not-allowed' 
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {actionLoadingId === club.id ? '...' : 'Leave'}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">You haven't joined any clubs yet.</p>
              )}
            </div>
            
            {/* Your Created Items */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg md:col-span-2"> {/* Span across 2 columns on medium screens */}
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Items You've Created</h2>
              {loading ? (
                 <p className="text-gray-500">Loading your items...</p>
              ) : createdItems.length > 0 ? (
                <ul className="space-y-3">
                  {createdItems.map(item => (
                    <li key={`${item.type}-${item.id}`} className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-b-0">
                      <div>
                        <Link 
                          to={item.type === 'event' ? `/events/${item.id}` : `/clubs/${item.id}`} 
                          className="font-medium text-indigo-700 hover:underline"
                        >
                          {item.name}
                        </Link>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${item.type === 'event' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          {item.type === 'event' ? 'Event' : 'Club'}
                        </span>
                      </div>
                      {/* Edit/Delete buttons for created items */}
                      <div className="flex items-center space-x-2">
                         <button 
                            onClick={() => openEditItemModal(item)} 
                            title="Edit" 
                            className="p-1 rounded text-gray-500 hover:bg-gray-200"
                            disabled={actionLoadingId === `${item.type}-${item.id}`}
                         > 
                            <Pencil className="w-4 h-4"/> 
                         </button>
                         <button 
                            onClick={() => handleDeleteItem(item)} 
                            title="Delete" 
                            className="p-1 rounded text-red-500 hover:bg-red-100"
                            disabled={actionLoadingId === `${item.type}-${item.id}`}
                         > 
                            {actionLoadingId === `${item.type}-${item.id}` ? '...' : <Trash2 className="w-4 h-4"/>}
                         </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">You haven't created any events or clubs yet.</p>
              )}
            </div>

          </div>
        </div>
        {/* Render Modals */}
        <EditEventModal
            isOpen={isEditEventModalOpen}
            event={editingItem?.type === 'event' ? editingItem as any : null} // Pass data, cast might be needed depending on exact types
            onClose={() => {
                setIsEditEventModalOpen(false);
                setEditingItem(null);
                fetchUserData(); // Refetch after closing
            }}
        />
         <EditClubModal
            isOpen={isEditClubModalOpen}
            club={editingItem?.type === 'club' ? editingItem as any : null} // Pass data, cast might be needed
            onClose={() => {
                setIsEditClubModalOpen(false);
                setEditingItem(null);
                fetchUserData(); // Refetch after closing
            }}
        />
      </div>
    </div>
  );
}
