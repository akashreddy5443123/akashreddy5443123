import { useState, useEffect } from 'react'; // Removed React import
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore'; // Import auth store
import { Bell, Plus, Pencil, Trash2 } from 'lucide-react'; // Import necessary icons
import { CreateAnnouncementModal } from '../components/CreateAnnouncementModal'; // Import the create modal
import { EditAnnouncementModal } from '../components/EditAnnouncementModal'; // Import the edit modal

interface Announcement {
  id: string;
  title: string;
  message: string; // Changed content to message
  created_at: string;
  created_by?: string; // Add creator ID
}

export function Announcements() {
  const { user } = useAuthStore(); // Get user info for permissions
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // State for create modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State for edit modal
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null); // State for announcement being edited
  // TODO: Add loading state for delete/edit actions if needed

  // Define fetchData function inside component but outside useEffect
  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('announcements')
        .select('*, created_by') // Fetch created_by
        .order('created_at', { ascending: false }); // Get latest first

      if (fetchError) throw fetchError;
      setAnnouncements(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load announcements');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []); // Empty dependency array, fetchData is defined outside

  // Handle Delete Announcement
  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!user) return; // Should not happen if button is shown correctly

    if (!window.confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    // TODO: Set loading state specifically for this announcement?
    try {
      // RLS policy handles permission check (creator or admin)
      const { error: deleteError } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId);

      if (deleteError) {
        console.error("Supabase delete announcement error:", deleteError);
        throw new Error(`Failed to delete announcement: ${deleteError.message}`);
      }

      console.log("Announcement deleted successfully, refetching data...");
      await fetchData(); // Refetch data

    } catch (err) {
      console.error("Error deleting announcement:", err);
      alert(err instanceof Error ? err.message : 'Failed to delete announcement');
    } finally {
      // TODO: Reset loading state
    }
  };

  // Function to open the create modal
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  // Function to open the edit modal
  const openEditModal = (announcement: Announcement) => {
    setEditingAnnouncement(announcement); // Set the announcement to edit
    setIsEditModalOpen(true); // Open the modal
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8"> {/* Container for title and button */}
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Bell className="w-8 h-8 mr-3 text-indigo-600"/>
          All Announcements
        </h1>
        {/* Create Button - Show only to admin */}
        {user?.is_admin && (
          <button
            onClick={openCreateModal} // Open the modal
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Announcement
          </button>
        )}
      </div>

      {loading && <p className="text-gray-500">Loading announcements...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && (
        announcements.length > 0 ? (
          <div className="space-y-6">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="bg-white/90 p-6 rounded-lg shadow-md backdrop-blur-sm relative"> {/* Added relative positioning */}
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold text-indigo-700">{announcement.title}</h2>
                  {/* Edit/Delete Buttons - Show to creator or admin */}
                  {(user?.id === announcement.created_by || user?.is_admin) && (
                    <div className="flex space-x-2 absolute top-4 right-4">
                       <button
                         onClick={() => openEditModal(announcement)} // Open edit modal on click
                         title="Edit Announcement"
                         className="p-1 rounded text-gray-500 hover:bg-gray-200"
                       >
                         <Pencil className="w-4 h-4" />
                       </button>
                       <button
                         onClick={() => handleDeleteAnnouncement(announcement.id)}
                         title="Delete Announcement"
                         className="p-1 rounded text-red-500 hover:bg-red-100"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  {new Date(announcement.created_at).toLocaleString()}
                </p>
                <p className="text-gray-800 whitespace-pre-wrap">{announcement.message}</p> {/* Display message */}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No announcements available.</p>
        )
      )}

      {/* Render the Create Modal */}
      <CreateAnnouncementModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          fetchData(); // Refetch data after create modal closes
        }}
      />

      {/* Render the Edit Modal */}
      <EditAnnouncementModal
        isOpen={isEditModalOpen}
        announcement={editingAnnouncement}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAnnouncement(null); // Clear selected announcement
          fetchData(); // Refetch data after edit modal closes
        }}
      />
    </div>
  );
}
