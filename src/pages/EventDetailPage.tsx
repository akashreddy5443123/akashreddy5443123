import { useState, useEffect } from 'react'; // Removed React import
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Calendar, MapPin, Clock, Users, Check, X, ArrowLeft } from 'lucide-react';

// Reusing the Event interface, ensure it includes necessary fields
interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  club: { id: string; name: string; } | null; // Fetch club details if needed
  capacity: number;
  image_url: string;
  registered_count: number; // Added dynamically
  is_registered?: boolean; // Added dynamically
  created_by?: string;
}

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch event details and registration status
  useEffect(() => {
    async function fetchEventData() {
      if (!eventId) {
        setError("Event ID not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch event details, including club name
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select(`
            *,
            club:clubs ( id, name )
          `)
          .eq('id', eventId)
          .single();

        if (eventError) throw eventError;
        if (!eventData) throw new Error("Event not found.");

        // Fetch registration count
        const { count, error: countError } = await supabase
          .from('event_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId);

        if (countError) throw countError;
        const currentCount = count || 0;
        setRegisteredCount(currentCount);

        // Check if current user is registered
        let currentUserRegistered = false;
        if (user?.id) {
          const { data: registrationData, error: regError } = await supabase
            .from('event_registrations')
            .select('event_id')
            .eq('user_id', user.id)
            .eq('event_id', eventId)
            .maybeSingle(); // Use maybeSingle as they might not be registered

          if (regError) throw regError;
          currentUserRegistered = !!registrationData; // True if a record exists
        }

        setEvent({ ...eventData, registered_count: currentCount });
        setIsRegistered(currentUserRegistered);

      } catch (err) {
        console.error("Error fetching event details:", err);
        setError(err instanceof Error ? err.message : 'Failed to load event details.');
        setEvent(null);
      } finally {
        setLoading(false);
      }
    }

    fetchEventData();
  }, [eventId, user]); // Refetch if eventId or user changes

  // Handle Register
  const handleRegister = async () => {
    if (!user || !event) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('event_registrations')
        .insert({ event_id: event.id, user_id: user.id });
      if (error) throw error;
      setIsRegistered(true);
      setRegisteredCount(prev => prev + 1);
    } catch (err) {
      console.error("Error registering:", err);
      alert(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Unregister
  const handleUnregister = async () => {
    if (!user || !event) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', event.id)
        .eq('user_id', user.id);
      if (error) throw error;
      setIsRegistered(false);
      setRegisteredCount(prev => Math.max(0, prev - 1)); // Prevent going below 0
    } catch (err) {
      console.error("Error unregistering:", err);
      alert(err instanceof Error ? err.message : 'Failed to unregister');
    } finally {
      setActionLoading(false);
    }
  };


  if (loading) {
    return <div className="text-center py-10">Loading event details...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">Error: {error}</div>;
  }

  if (!event) {
    return <div className="text-center py-10">Event not found.</div>;
  }

  const isFull = registeredCount >= event.capacity;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
       <Link to="/events" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
         <ArrowLeft className="w-4 h-4 mr-2" />
         Back to Events
       </Link>

      <div className="bg-white/90 rounded-lg shadow-md overflow-hidden backdrop-blur-sm">
        <img
          src={event.image_url || 'https://via.placeholder.com/800x400?text=No+Image'}
          alt={event.title}
          className="w-full h-64 object-cover" // Adjust height as needed
        />
        <div className="p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>
          {event.club && (
             <Link to={`/clubs`} className="text-indigo-600 font-medium mb-4 inline-block hover:underline">
               Hosted by: {event.club.name}
             </Link>
          )}
          <p className="text-gray-700 mb-6">{event.description || 'No description available.'}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0" />
              <span className="text-gray-800">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0" />
              <span className="text-gray-800">{event.time}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0" />
              <span className="text-gray-800">{event.location}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0" />
              <span className="text-gray-800">{registeredCount}/{event.capacity} registered</span>
            </div>
          </div>

          {/* Registration Button */}
          {user && (
            <div className="mt-6 text-center">
              {isRegistered ? (
                <button
                  onClick={handleUnregister}
                  disabled={actionLoading}
                  className={`px-8 py-3 rounded-lg flex items-center justify-center w-full md:w-auto md:inline-flex ${
                    actionLoading
                      ? 'bg-red-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white text-lg font-semibold`}
                >
                  {actionLoading ? 'Unregistering...' : <> <X className="w-5 h-5 mr-2"/> Unregister </>}
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={actionLoading || isFull}
                  className={`px-8 py-3 rounded-lg flex items-center justify-center w-full md:w-auto md:inline-flex ${
                    actionLoading || isFull
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } text-white text-lg font-semibold`}
                >
                  {actionLoading ? 'Registering...' :
                   isFull ? 'Event Full' : <> <Check className="w-5 h-5 mr-2"/> Register Now </>}
                </button>
              )}
            </div>
          )}
          {!user && (
             <p className="text-center mt-6 text-gray-600">Please sign in to register for this event.</p>
             // TODO: Add Sign In button here?
          )}
        </div>
      </div>
    </div>
  );
}
