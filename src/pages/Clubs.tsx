import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Globe, MapPin, Calendar, Plus, Check, X, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { shallow } from 'zustand/shallow';
import { CreateClubModal } from '../components/CreateClubModal';
import { EditClubModal } from '../components/EditClubModal';

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
  is_member?: boolean;
  created_by?: string;
}

export function Clubs() {
  const { user } = useAuthStore(state => ({ user: state.user }), shallow);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [memberships, setMemberships] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingClubId, setActionLoadingClubId] = useState<string | null>(null);

  // Wrap fetchData in useCallback, depending only on user?.id
  const fetchData = useCallback(async () => {
    // Only set loading true if there's no data currently displayed
    if (clubs.length === 0) {
        setLoading(true);
    }
    // setError(null); // Reset error later or on success/start
    try {
      const { data: clubsData, error: clubsError } = await supabase
        .from('clubs')
        .select('*, created_by');
      if (clubsError) throw clubsError;

      let userMemberships = new Set<string>();
      if (user?.id) {
        const { data: membershipData, error: membershipError } = await supabase
          .from('club_memberships')
          .select('club_id')
          .eq('user_id', user.id);
        if (membershipError) throw membershipError;
        userMemberships = new Set(membershipData?.map(m => m.club_id) || []);
      }
      setClubs(clubsData || []);
      setMemberships(userMemberships);
      setError(null); // Clear error on successful fetch
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      // Don't clear data on error
      // setClubs([]);
      // setMemberships(new Set());
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // Dependency only on user?.id

  useEffect(() => {
    fetchData();
  // Include fetchData in the dependency array
  }, [fetchData]); // Depend only on the memoized fetchData

  const clubsWithMembership = useMemo(() => {
    return clubs.map(club => ({
      ...club,
      is_member: memberships.has(club.id)
    }));
  }, [clubs, memberships]);

  const handleJoin = async (clubId: string) => {
    if (!user) { alert('Please sign in to join clubs.'); return; }
    setActionLoadingClubId(clubId);
    try {
      const { error } = await supabase.from('club_memberships').insert({ club_id: clubId, user_id: user.id });
      if (error) throw error;
      setMemberships(prev => new Set(prev).add(clubId));
    } catch (err) { console.error("Error joining club:", err); alert(err instanceof Error ? err.message : 'Failed to join club'); }
    finally { setActionLoadingClubId(null); }
  };

  const handleLeave = async (clubId: string) => {
     if (!user) return;
     setActionLoadingClubId(clubId);
     try {
       const { error } = await supabase.from('club_memberships').delete().eq('club_id', clubId).eq('user_id', user.id);
       if (error) throw error;
       setMemberships(prev => { const newSet = new Set(prev); newSet.delete(clubId); return newSet; });
     } catch (err) { console.error("Error leaving club:", err); alert(err instanceof Error ? err.message : 'Failed to leave club'); }
     finally { setActionLoadingClubId(null); }
  };

  const handleDeleteClub = async (clubId: string) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this club? This action cannot be undone.")) return;
    setActionLoadingClubId(clubId);
    try {
      const { error } = await supabase.from('clubs').delete().eq('id', clubId);
      if (error) throw error;
      await fetchData();
    } catch (err) { console.error("Error deleting club:", err); alert(err instanceof Error ? err.message : 'Failed to delete club'); }
    finally { setActionLoadingClubId(null); }
  };

  const openEditModal = (clubToEdit: Club) => {
    setEditingClub(clubToEdit);
    setIsEditModalOpen(true);
  };

  // Loading State - Show only if loading AND no clubs exist yet
  if (loading && clubs.length === 0) return <div className="text-center py-10">Loading clubs...</div>;
  if (error) return <div className="text-center py-10 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Clubs Directory</h1>
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus className="w-5 h-5 mr-2" /> Create Club
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {clubsWithMembership.map((club) => (
          <div key={club.id} className="bg-white/90 rounded-lg shadow-md overflow-hidden backdrop-blur-sm flex flex-col">
            {/* Link wraps the image and main info section */}
            <Link to={`/clubs/${club.id}`} className="block hover:opacity-90 transition-opacity">
              <img src={club.image_url || 'https://via.placeholder.com/400x200?text=No+Image'} alt={club.name} className="w-full h-48 object-cover" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">{club.name}</h2>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">{club.category}</span>
                </div>
                <p className="text-gray-600 mb-6 line-clamp-3">{club.description}</p> {/* Added line-clamp */}
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600 text-sm"><Calendar className="h-4 w-4 mr-2 flex-shrink-0" /><span>{club.meeting_time}</span></div>
                  <div className="flex items-center text-gray-600 text-sm"><MapPin className="h-4 w-4 mr-2 flex-shrink-0" /><span>{club.location}</span></div>
                  <div className="flex items-center text-gray-600 text-sm"><Mail className="h-4 w-4 mr-2 flex-shrink-0" /><a href={`mailto:${club.email}`} className="text-indigo-600 hover:underline truncate">{club.email}</a></div>
                  {club.website && (<div className="flex items-center text-gray-600 text-sm"><Globe className="h-4 w-4 mr-2 flex-shrink-0" /><a href={club.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate">{club.website}</a></div>)}
                </div>
              </div>
            </Link>
            {/* Buttons Section - Outside the main Link */}
            <div className="p-6 pt-2 border-t border-gray-200 mt-auto"> {/* Ensure buttons are at bottom */}
              <div className="flex items-center justify-between">
                {/* Join/Leave Button */}
                {user && (
                  club.is_member ? (
                    <button onClick={() => handleLeave(club.id)} disabled={actionLoadingClubId === club.id} className={`btn-secondary-danger w-full mr-2 ${actionLoadingClubId === club.id ? 'opacity-50' : ''}`}> <X className="w-4 h-4 mr-1"/> Leave </button>
                  ) : (
                    <button onClick={() => handleJoin(club.id)} disabled={actionLoadingClubId === club.id} className={`btn-primary w-full mr-2 ${actionLoadingClubId === club.id ? 'opacity-50' : ''}`}> <Check className="w-4 h-4 mr-1"/> Join </button>
                  )
                )}
                {/* Edit/Delete Buttons */}
                {(user?.id === club.created_by || user?.is_admin) && (
                  <div className={`flex items-center space-x-2 ${!user ? 'ml-auto' : ''}`}> {/* Pushes buttons right if no join/leave */}
                    <button onClick={() => openEditModal(club)} disabled={actionLoadingClubId === club.id} title="Edit Club" className={`btn-icon ${actionLoadingClubId === club.id ? 'cursor-not-allowed' : ''}`}> <Pencil className="w-4 h-4"/> </button>
                    <button onClick={() => handleDeleteClub(club.id)} disabled={actionLoadingClubId === club.id} title="Delete Club" className={`btn-icon-danger ${actionLoadingClubId === club.id ? 'cursor-not-allowed' : ''}`}> <Trash2 className="w-4 h-4"/> </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <CreateClubModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); fetchData(); }} />
      <EditClubModal isOpen={isEditModalOpen} club={editingClub} onClose={() => { setIsEditModalOpen(false); setEditingClub(null); fetchData(); }} />

      {/* Removed invalid <style jsx> block. Apply Tailwind classes directly. */}
    </div>
  );
}
