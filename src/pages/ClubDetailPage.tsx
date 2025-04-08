import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Mail, Globe, MapPin, Calendar, Users, ArrowLeft, Check, X, Pencil, Trash2 } from 'lucide-react'; // Users icon already imported
import { EditClubModal } from '../components/EditClubModal';

// Interfaces (can be refined or imported)
interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  meeting_time: string;
  location: string;
  email: string;
  website: string;
  image_url: string;
  created_by?: string; // User ID of the creator
}

// Interface for member display data
interface MemberDisplayInfo {
  user_id: string;
  display_name: string; // Store the final name to display
}


interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  image_url: string;
  capacity: number;
  registered_count: number; // Needs to be fetched or calculated
}

export function ClubDetailPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const { user } = useAuthStore();
  const [club, setClub] = useState<Club | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isMember, setIsMember] = useState(false); // Keep only one declaration
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [members, setMembers] = useState<MemberDisplayInfo[]>([]); // Use new interface for state
  const [loadingMembers, setLoadingMembers] = useState(false);
  const navigate = useNavigate();

  // Function to fetch members (memoized with useCallback) - Separate Queries Approach
  const fetchMembers = useCallback(async (currentClubId: string) => {
    setLoadingMembers(true);
    setMembers([]); // Clear previous members
    try {
      // 1. Fetch member IDs from club_memberships
      const { data: membershipData, error: membershipError } = await supabase
        .from('club_memberships')
        .select('user_id')
        .eq('club_id', currentClubId);

      if (membershipError) throw membershipError;
      if (!membershipData || membershipData.length === 0) {
        setLoadingMembers(false);
        return; // No members
      }

      const memberIds = membershipData.map(m => m.user_id);

      // 2. Fetch profiles for those member IDs
      // Assuming profiles.id references auth.users.id (which is stored in club_memberships.user_id)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name') // Select id and full_name
        .in('id', memberIds); // Match profiles.id with the user_ids from memberships

      if (profilesError) throw profilesError;

      // 3. Create display info, falling back if profile or name is missing
      const displayMembers = memberIds.map(userId => {
        const profile = profilesData?.find(p => p.id === userId);
        const fullName = profile?.full_name?.trim();
        return {
          user_id: userId,
          display_name: fullName ? fullName : 'Club Member' // Fallback
        };
      });

      setMembers(displayMembers);

    } catch (err) {
      console.error("Error fetching club members (separate queries):", err);
      // Optionally set an error state for members
    } finally {
      setLoadingMembers(false);
    }
  }, []); // Empty dependency array as it doesn't depend on component state directly

  // Define fetchClubData function inside component but outside useEffect
  const fetchClubData = useCallback(async () => {
    if (!clubId) {
      setError("Club ID not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch club details
        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select('*') // Select all club fields including created_by
          .eq('id', clubId)
          .single();

        if (clubError) throw clubError;
        if (!clubData) throw new Error("Club not found.");
        setClub(clubData);

        // Fetch upcoming events for this club
        const today = new Date().toISOString().split('T')[0];
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*') // Select necessary event fields
          .eq('club_id', clubId)
          .gte('date', today)
          .order('date', { ascending: true });

        if (eventsError) throw eventsError;
        
        // Fetch registration counts for these events (can be performance intensive)
        const eventsWithCounts = await Promise.all((eventsData || []).map(async (event) => {
            const { count } = await supabase
              .from('event_registrations')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id);
            return { ...event, registered_count: count || 0 };
        }));
        setEvents(eventsWithCounts);


        // Check membership status
        if (user?.id) {
          const { data: membershipData, error: membershipError } = await supabase
            .from('club_memberships')
            .select('club_id')
            .eq('user_id', user.id)
            .eq('club_id', clubId)
            .maybeSingle();

          setIsMember(!!membershipData);
        } else {
          setIsMember(false);
        }

        // After fetching club, check permissions and fetch members if allowed
        if (clubData && user && (user.id === clubData.created_by || user.is_admin)) {
          fetchMembers(clubId); // Fetch members for this club
        } else {
          setMembers([]); // Clear members if user doesn't have permission
        }

      } catch (err) {
        console.error("Error fetching club details/members:", err);
        setError(err instanceof Error ? err.message : 'Failed to load club details.');
        setClub(null);
        setEvents([]);
      } finally {
        setLoading(false);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, user, fetchMembers]); // Add fetchMembers to dependencies

  // Fetch club details, events, and membership status on mount or when relevant data changes
  useEffect(() => {
    if (clubId) {
        fetchClubData();
    }
  }, [clubId, user, fetchClubData]); // Use fetchClubData in dependency array

  // --- Action Handlers (Join, Leave, Delete) ---
  // TODO: Refactor these into a hook or service if used elsewhere

  const handleJoin = async () => {
    if (!user || !club) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('club_memberships')
        .insert({ club_id: club.id, user_id: user.id });
      if (error) throw error;
      setIsMember(true);
    } catch (err) {
      console.error("Error joining club:", err);
      alert(err instanceof Error ? err.message : 'Failed to join club');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
     if (!user || !club) return;
     setActionLoading(true);
     try {
       const { error } = await supabase
         .from('club_memberships')
         .delete()
         .eq('club_id', club.id)
         .eq('user_id', user.id);
       if (error) throw error;
       setIsMember(false);
     } catch (err) {
       console.error("Error leaving club:", err);
       alert(err instanceof Error ? err.message : 'Failed to leave club');
     } finally {
       setActionLoading(false);
     }
  };

  const handleDeleteClub = async () => {
    if (!user || !club) return; // Should not happen

    if (!window.confirm("Are you sure you want to delete this club and all its associated events? This action cannot be undone.")) {
      return;
    }
    setActionLoading(true);
    try {
      const { error } = await supabase.from('clubs').delete().eq('id', club.id);
      if (error) throw error;
      // Navigate back to clubs list after successful delete
      alert("Club deleted successfully."); 
      navigate('/clubs'); // Use navigate hook
    } catch (err) {
      console.error("Error deleting club:", err);
      alert(err instanceof Error ? err.message : 'Failed to delete club');
    } finally {
      setActionLoading(false);
    }
  };

  // Function to open the edit modal
  const openEditModal = () => {
      if (club) { // Ensure club data is loaded
          setIsEditModalOpen(true);
      }
  };

  // --- Render Logic ---

  if (loading) {
    return <div className="text-center py-10">Loading club details...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">Error: {error}</div>;
  }

  if (!club) {
    return <div className="text-center py-10">Club not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/clubs" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Clubs Directory
      </Link>

      <div className="bg-white/90 rounded-lg shadow-md overflow-hidden backdrop-blur-sm mb-8">
        <img
          src={club.image_url || 'https://via.placeholder.com/1000x400?text=Club+Image'}
          alt={club.name}
          className="w-full h-48 md:h-64 object-cover"
        />
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold">{club.name}</h1>
                <span className="mt-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm inline-block">
                  {club.category}
                </span>
            </div>
             {/* Action Buttons */}
             <div className="flex items-center space-x-3 mt-4 md:mt-0">
                {user && (
                    isMember ? (
                    <button onClick={handleLeave} disabled={actionLoading} className={`btn-secondary-danger ${actionLoading ? 'opacity-50' : ''}`}>
                        <X className="w-4 h-4 mr-1"/> Leave Club
                    </button>
                    ) : (
                    <button onClick={handleJoin} disabled={actionLoading} className={`btn-primary ${actionLoading ? 'opacity-50' : ''}`}>
                        <Check className="w-4 h-4 mr-1"/> Join Club
                    </button>
                    )
                )}
                 {(user?.id === club.created_by || user?.is_admin) && (
                    <>
                        <button onClick={openEditModal} title="Edit Club" className="btn-icon"> <Pencil className="w-4 h-4"/> </button>
                        <button onClick={handleDeleteClub} disabled={actionLoading} title="Delete Club" className={`btn-icon-danger ${actionLoading ? 'opacity-50' : ''}`}> <Trash2 className="w-4 h-4"/> </button>
                    </>
                 )}
             </div>
          </div>

          <p className="text-gray-700 mb-6">{club.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 border-t pt-6">
             <div className="flex items-start">
               <Calendar className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0 mt-1" />
               <div>
                 <span className="font-semibold">Meeting Time:</span>
                 <p className="text-gray-800">{club.meeting_time || 'Not specified'}</p>
               </div>
             </div>
             <div className="flex items-start">
               <MapPin className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                 <span className="font-semibold">Location:</span>
                 <p className="text-gray-800">{club.location || 'Not specified'}</p>
               </div>
             </div>
             <div className="flex items-start">
               <Mail className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                 <span className="font-semibold">Contact:</span>
                 <a href={`mailto:${club.email}`} className="text-indigo-600 hover:underline block break-all">
                    {club.email || 'Not specified'}
                  </a>
               </div>
             </div>
             {club.website && (
               <div className="flex items-start">
                 <Globe className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                   <span className="font-semibold">Website:</span>
                   <a href={club.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline block break-all">
                     {club.website}
                   </a>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Upcoming Events Section */}
      <h2 className="text-2xl font-bold mb-6">Upcoming Events by {club.name}</h2>
      {events.length > 0 ? (
        <div className="space-y-6">
          {/* TODO: Replace with actual EventCard component if available */}
          {events.map(event => (
             <div key={event.id} className="bg-white/90 p-4 rounded-lg shadow-sm border flex items-center justify-between">
               <div>
                 <Link to={`/events/${event.id}`} className="font-semibold text-indigo-700 hover:underline">{event.title}</Link>
                 <p className="text-sm text-gray-600">{new Date(event.date).toLocaleDateString()} - {event.time}</p>
                 <p className="text-sm text-gray-500">{event.location}</p>
               </div>
               <Link to={`/events/${event.id}`} className="btn-secondary text-sm">View Details</Link>
             </div>
          ))}
        </div>
      ) : (
         <p className="text-gray-500">This club has no upcoming events scheduled.</p>
      )}

      {/* Render Edit Club Modal */}
      <EditClubModal 
        isOpen={isEditModalOpen} 
        club={club} // Pass the fetched club data
        onClose={() => {
            setIsEditModalOpen(false);
            fetchClubData(); // Refetch data after closing modal
        }}
      />

      {/* Members Section (Visible only to creator or admin) */}
      {(user?.id === club.created_by || user?.is_admin) && (
        <div className="mt-10 pt-8 border-t">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Users className="w-6 h-6 mr-3 text-indigo-600" /> Club Members ({members.length})
          </h2>
          {loadingMembers ? (
            <p>Loading members...</p>
          ) : members.length > 0 ? (
            <ul className="space-y-3 list-disc list-inside bg-white/90 p-4 rounded-lg shadow-sm border">
              {members.map((member) => (
                // Use the pre-calculated display_name from the state
                <li key={member.user_id} className="text-gray-800">
                  {member.display_name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 bg-white/90 p-4 rounded-lg shadow-sm border">No members have joined this club yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
