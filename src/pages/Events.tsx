import { useState, useEffect, useMemo, useCallback } from 'react'; // Import useCallback
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { Calendar as CalendarIcon, MapPin, Clock, Users, Plus, Check, X, Star, Pencil, Trash2 } from 'lucide-react'; // Renamed Calendar icon import
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { shallow } from 'zustand/shallow'; // Import shallow
import { CreateEventModal } from '../components/CreateEventModal';
import { EditEventModal } from '../components/EditEventModal';
import { Calendar, dateFnsLocalizer, Event as CalendarEvent } from 'react-big-calendar'; // Import Calendar component and Event type
import { format, parse, startOfWeek, getDay } from 'date-fns'; // Correct named imports
import { enUS } from 'date-fns/locale'; // Correct locale import path
import 'react-big-calendar/lib/css/react-big-calendar.css'; // Import calendar styles

// Interface for Event data, including optional fields
interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  club: { name: string; }[] | null; // Keep this for display if needed
  club_id: string | null; // Add club_id
  capacity: number;
  image_url: string;
  registered_count: number; // Added dynamically
  is_registered?: boolean; // Added dynamically
  category?: string; // Optional category for filtering
  created_by?: string; // Add creator ID
  // Add start and end properties for the calendar
  start?: Date;
  end?: Date;
}

// Type for the raw data structure from Supabase queries
// Ensure this includes all fields selected directly from the 'events' table
interface RawEventSelect {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  club: { name: string; }[] | null; // This comes from the join, keep it if needed for display
  club_id: string | null; // Add club_id fetched directly
  capacity: number;
  image_url: string;
  category?: string;
  created_by?: string; // Add created_by fetched directly
}

export function Events() {
  // Use shallow comparison for the user object
  const { user } = useAuthStore(state => ({ user: state.user }), shallow);
  const [events, setEvents] = useState<Event[]>([]); // Main list of events
  const [suggestedEvents, setSuggestedEvents] = useState<Event[]>([]); // Suggested events
  const [registrations, setRegistrations] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State for edit modal
  const [editingEvent, setEditingEvent] = useState<Event | null>(null); // State for event being edited
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingEventId, setActionLoadingEventId] = useState<string | null>(null);
  const navigate = useNavigate(); // Hook for navigation

  // Setup for react-big-calendar
  const locales = { 'en-US': enUS };
  const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
  });

  // Wrap fetchData in useCallback
  const fetchData = useCallback(async () => {
    // Only set loading true if there's no data currently displayed
    if (events.length === 0 && suggestedEvents.length === 0) {
        setLoading(true);
    }
    // setError(null); // Reset error later or on success/start
    try {
      const today = new Date().toISOString().split('T')[0];
      let joinedClubIds: string[] = [];
      let fetchedSuggestedEvents: RawEventSelect[] = []; // Corrected type declaration
      let fetchedEventsData: RawEventSelect[] = []; // Use specific type

      // 1. Fetch user's joined club IDs
      if (user?.id) {
        // Corrected destructuring: added comma
        const { data: membershipData, error: membershipError } = await supabase
          .from('club_memberships')
          .select('club_id')
          .eq('user_id', user.id);
        if (membershipError) throw membershipError;
        joinedClubIds = membershipData?.map(m => m.club_id) || [];
      }

      // 2. Fetch suggested events (upcoming events from joined clubs)
      if (joinedClubIds.length > 0) {
        const { data: suggestedData, error: suggestedError } = await supabase
          .from('events')
          .select(`*, created_by, club_id, club:clubs ( name )`) // Select club_id
          .in('club_id', joinedClubIds)
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(3); // Limit suggestions
        if (suggestedError) throw suggestedError;
        // Cast to RawEventSelect[] first
        fetchedSuggestedEvents = (suggestedData || []) as RawEventSelect[];
      }

      // 3. Fetch all other upcoming events (excluding suggested ones)
      let query = supabase
        .from('events')
        .select(`*, created_by, club_id, club:clubs ( name )`) // Select club_id (already done)
        .gte('date', today)
        .order('date', { ascending: true });

      const suggestedIds = fetchedSuggestedEvents.map(e => e.id);
      if (suggestedIds.length > 0) {
        query = query.not('id', 'in', `(${suggestedIds.join(',')})`);
      }

      const { data: eventsDataResult, error: eventsError } = await query;
      if (eventsError) throw eventsError;
      fetchedEventsData = (eventsDataResult || []) as RawEventSelect[];

      // 4. Fetch user's registrations for all potentially displayed events
      let userRegistrations = new Set<string>();
      const allPotentialEventIds = [...suggestedIds, ...fetchedEventsData.map(e => e.id)];
      if (user?.id && allPotentialEventIds.length > 0) {
        const { data: regData, error: regError } = await supabase
          .from('event_registrations')
          .select('event_id')
          .eq('user_id', user.id)
          .in('event_id', allPotentialEventIds);
        if (regError) throw regError;
        userRegistrations = new Set(regData?.map(r => r.event_id) || []);
      }
      setRegistrations(userRegistrations);

      // 5. Get registration counts and combine data
      const allEventsData = [...fetchedSuggestedEvents, ...fetchedEventsData];
      const eventsWithCounts = await Promise.all(allEventsData.map(async (event) => {
        const { count } = await supabase
          .from('event_registrations')
          .select('*', { count: 'exact' })
          .eq('event_id', event.id);
        return {
          ...event,
          registered_count: count || 0
        };
      }));

      // Separate suggestions and main list again after adding counts
      // Now eventsWithCounts should conform to the Event interface (including club_id)
      const finalSuggested: Event[] = eventsWithCounts.filter(e => suggestedIds.includes(e.id));
      const finalEvents: Event[] = eventsWithCounts.filter(e => !suggestedIds.includes(e.id));

      setSuggestedEvents(finalSuggested);
      setEvents(finalEvents);
      setError(null); // Clear error on successful fetch

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      // Don't clear data on error, keep showing potentially stale data instead of flashing empty
      // setEvents([]);
      // setSuggestedEvents([]);
      // setRegistrations(new Set());
    } finally {
      setLoading(false);
    }
  // Update dependencies for useCallback: only depend on user?.id
  }, [user?.id, events.length, suggestedEvents.length]); // Keep length dependencies for the loading check

  // Fetch data when the memoized fetchData function changes (effectively, when user?.id changes)
  // Also, ensure auth isn't loading initially to avoid double fetch on load
  const authLoading = useAuthStore(state => state.loading);
  useEffect(() => {
    if (!authLoading) { // Only fetch if auth is not in its initial loading state
        fetchData();
    }
  }, [fetchData, authLoading]);

  // Add is_registered flag to both lists using useMemo
   const suggestedEventsWithReg = useMemo(() => {
     return suggestedEvents.map(event => ({
       ...event,
       is_registered: registrations.has(event.id)
     }));
   }, [suggestedEvents, registrations]);

   const eventsWithReg = useMemo(() => {
     return events.map(event => ({
       ...event,
       is_registered: registrations.has(event.id)
     }));
   }, [events, registrations]);

  // Define the type for the calendar event object explicitly
  interface MyCalendarEvent extends CalendarEvent {
    resource: Event; // Ensure resource holds our original Event type
  }

  // Format events for the calendar
  const calendarEvents: MyCalendarEvent[] = useMemo(() => { // Use the explicit type
    return [...suggestedEventsWithReg, ...eventsWithReg].map(event => {
      // Combine date and time using the correct format string 'yyyy-MM-dd h:mm a'
      // Provide a default time that is parseable if event.time is null/undefined
      const timeString = event.time || '12:00 AM'; 
      const startDate = parse(`${event.date} ${timeString}`, 'yyyy-MM-dd h:mm a', new Date());
      
      // Check if parsing failed
      if (isNaN(startDate.getTime())) {
        console.warn(`Failed to parse date/time for event "${event.title}": date='${event.date}', time='${event.time}'`);
        // Return a placeholder or skip this event? Skipping for now.
        return null; 
      }

      // Set a default end time (e.g., 1 hour after start) if not provided
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add 1 hour

      // Explicitly create the object for the calendar
      return {
        title: event.title,
        start: startDate,
        end: endDate,
        resource: event, // Store the original event object in the resource field
      };
    }).filter(event => event !== null) as MyCalendarEvent[]; // Filter out nulls from failed parsing
  }, [suggestedEventsWithReg, eventsWithReg]);

  // Log the calendar events to check the is_registered flag
  useEffect(() => {
    console.log("Calendar Events Data:", calendarEvents);
  }, [calendarEvents]);

  // Function to apply styles to calendar events
  const eventPropGetter = useCallback(
    (event: MyCalendarEvent) => {
      const props: { className?: string; style?: React.CSSProperties } = {};
      if (event.resource.is_registered) {
        console.log(`Event "${event.title}" IS registered, applying class.`); // Log registered
        props.className = 'registered-event';
      } else {
        // console.log(`Event "${event.title}" is NOT registered.`); // Optional log for non-registered
      }
      // TODO: Add logic for suggested events if needed
      // if (suggestedEvents.some(se => se.id === event.resource.id)) {
      //   props.className = `${props.className || ''} suggested-event`;
      // }
      return props; // Return object with className property
    },
    [registrations] // Add registrations as a dependency
  );

  // Handle Register
  const handleRegister = async (eventId: string) => {
    if (!user) {
      alert('Please sign in to register.'); // TODO: Open AuthModal
      return;
    }
    setActionLoadingEventId(eventId);
    try {
      const { error } = await supabase
        .from('event_registrations')
        .insert({ event_id: eventId, user_id: user.id });
      if (error) throw error;
      // Update local state immediately for responsiveness
      setRegistrations(prev => new Set(prev).add(eventId));
      // Update counts in both lists
      setEvents(prevEvents => prevEvents.map(e => e.id === eventId ? {...e, registered_count: e.registered_count + 1} : e));
      setSuggestedEvents(prevEvents => prevEvents.map(e => e.id === eventId ? {...e, registered_count: e.registered_count + 1} : e));
      // Optionally refetch in background or rely on local update
      // await fetchData();
    } catch (err) {
      console.error("Error registering for event:", err);
      alert(err instanceof Error ? err.message : 'Failed to register');
      // Revert optimistic update if needed, or refetch
      await fetchData();
    } finally {
      setActionLoadingEventId(null);
    }
  };

  // Handle Unregister
  const handleUnregister = async (eventId: string) => {
    if (!user) return;
    setActionLoadingEventId(eventId);
    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      // Explicitly check the error returned by the delete operation
      if (error) {
        console.error("Supabase delete error:", error);
        throw new Error(`Failed to unregister: ${error.message}`);
      }

      // Only refetch data if the delete operation was successful (no error)
      console.log("Unregistration successful, refetching data...");
      await fetchData();

    } catch (err) {
      console.error("Error unregistering from event:", err);
      alert(err instanceof Error ? err.message : 'Failed to unregister');
      // Do not refetch on error
    } finally {
      setActionLoadingEventId(null);
    }
  };

  // Handle Delete Event
  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return; // Should not happen if button is shown correctly

    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }

    setActionLoadingEventId(eventId); // Use same loading state for delete
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error("Supabase delete event error:", error);
        throw new Error(`Failed to delete event: ${error.message}`);
      }

      console.log("Event deleted successfully, refetching data...");
      await fetchData(); // Refetch data to update the list

    } catch (err) {
      console.error("Error deleting event:", err);
      alert(err instanceof Error ? err.message : 'Failed to delete event');
    } finally {
      setActionLoadingEventId(null);
    }
  };

  // Function to open the edit modal
  const openEditModal = (eventToEdit: Event) => {
    setEditingEvent(eventToEdit);
    setIsEditModalOpen(true);
  };


  // Reusable function to render an event card (kept for suggested events)
  const renderEventCard = (event: Event) => (
    <div key={event.id} className="bg-white/90 rounded-lg shadow-md overflow-hidden backdrop-blur-sm">
      <div className="md:flex">
        <div className="md:w-1/3">
           <img
             src={event.image_url || 'https://via.placeholder.com/400x200?text=No+Image'}
             alt={event.title}
             className="h-full w-full object-cover"
           />
        </div>
        <div className="p-6 md:w-2/3">
          <h2 className="text-2xl font-bold mb-4">{event.title}</h2>
          <p className="text-gray-600 mb-4">{event.description || 'No description available.'}</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-indigo-600 mr-2" />
              <span>{new Date(event.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-indigo-600 mr-2" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-indigo-600 mr-2" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-indigo-600 mr-2" />
              <span>{event.registered_count}/{event.capacity} registered</span>
            </div>
          </div>
            <div className="flex items-center justify-between">
            <span className="text-indigo-600 font-medium">{event.club?.[0]?.name || 'Campus Event'}</span>
            {user && (
              event.is_registered ? (
                <button
                  onClick={() => handleUnregister(event.id)}
                  disabled={actionLoadingEventId === event.id}
                  className={`px-6 py-2 rounded-lg flex items-center ${
                    actionLoadingEventId === event.id
                      ? 'bg-red-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white`}
                >
                  {actionLoadingEventId === event.id ? 'Unregistering...' : <> <X className="w-4 h-4 mr-1"/> Unregister </>}
                </button>
              ) : (
                <button
                  onClick={() => handleRegister(event.id)}
                  disabled={actionLoadingEventId === event.id || event.registered_count >= event.capacity}
                  className={`px-6 py-2 rounded-lg flex items-center ${
                    actionLoadingEventId === event.id || event.registered_count >= event.capacity
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } text-white`}
                >
                  {actionLoadingEventId === event.id ? 'Registering...' :
                   event.registered_count >= event.capacity ? 'Full' : <> <Check className="w-4 h-4 mr-1"/> Register Now </>}
                </button>
              )
            )}
             {/* Edit/Delete Buttons Container */}
             {(user?.id === event.created_by || user?.is_admin) && (
               <div className="flex items-center space-x-2 ml-4">
                 {/* Edit Button */}
                 <button
                   onClick={() => openEditModal(event)}
                   disabled={actionLoadingEventId === event.id}
                   title="Edit Event"
                   className={`p-1 rounded text-gray-500 hover:bg-gray-200 ${actionLoadingEventId === event.id ? 'cursor-not-allowed' : ''}`}
                 >
                   <Pencil className="w-4 h-4" />
                 </button>
                 {/* Delete Button */}
                 <button
                   onClick={() => handleDeleteEvent(event.id)}
                   disabled={actionLoadingEventId === event.id}
                   title="Delete Event"
                   className={`p-1 rounded text-red-500 hover:bg-red-100 ${actionLoadingEventId === event.id ? 'cursor-not-allowed' : ''}`}
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );

  // Loading State - Show only if loading AND no events exist yet
  if (loading && calendarEvents.length === 0 && suggestedEventsWithReg.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center text-gray-600">Loading events...</div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-red-600 text-center">Error: {error}</div>
      </div>
    );
  }

  // Main Content
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
         <h1 className="text-3xl font-bold text-gray-900">Events Calendar</h1>
        {/* Keep Create Event button accessible */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Event
        </button>
      </div>

      {/* Suggested Events Section */}
      {user && suggestedEventsWithReg.length > 0 && (
        <div className="mb-12">
           <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
             <Star className="w-6 h-6 mr-2 text-yellow-500"/>
             Suggested for You
           </h2>
           <div className="space-y-8">
             {suggestedEventsWithReg.map(renderEventCard)}
           </div>
           <hr className="my-12 border-gray-300"/>
        </div>
      )}

      {/* --- Calendar View --- */}
      <div className="mb-12 bg-white/90 p-4 rounded-lg shadow-md backdrop-blur-sm" style={{ height: '70vh' }}> {/* Added container with height */}
        {/* Use standard JSX syntax for Calendar */}
        <Calendar<MyCalendarEvent>
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }} // Make calendar fill container height
          onSelectEvent={(event: MyCalendarEvent) => navigate(`/events/${event.resource.id}`)} // Use the explicit type here too
          eventPropGetter={eventPropGetter} // Apply the style getter
          // TODO: Add more props like views, defaultView, toolbar customization etc.
        />
      </div>

      {/* --- List View (Optional - kept for reference or if needed) --- */}
      {/*
      {user && suggestedEventsWithReg.length > 0 && (
        <div className="mb-12">
           <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
             <Star className="w-6 h-6 mr-2 text-yellow-500"/>
             Suggested for You
           </h2>
           <div className="space-y-8">
             {suggestedEventsWithReg.map(renderEventCard)}
           </div>
           <hr className="my-12 border-gray-300"/>
        </div>
      )}
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Upcoming Events</h2>
      {eventsWithReg.length > 0 ? (
         <div className="space-y-8">
           {eventsWithReg.map(renderEventCard)}
         </div>
      ) : (
         <p className="text-gray-500">No other upcoming events found.</p>
      )}
      */}

      {/* --- Modals --- */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          fetchData(); // Refetch data after create modal closes
        }}
      />

      {/* Render the Edit Modal */}
      <EditEventModal
        isOpen={isEditModalOpen}
        event={editingEvent}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingEvent(null); // Clear selected event
          fetchData(); // Refetch data after edit modal closes
        }}
      />
    </div>
  );
}
