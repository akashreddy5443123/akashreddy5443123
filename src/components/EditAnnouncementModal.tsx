import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { X } from 'lucide-react';

// Re-use or define the Announcement interface
interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  created_by?: string;
}

interface EditAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null; // Announcement to edit
}

export function EditAnnouncementModal({ isOpen, onClose, announcement }: EditAnnouncementModalProps) {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill form when announcement data changes (modal opens)
  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title);
      setContent(announcement.content);
    } else {
      // Reset if no announcement is passed (e.g., modal closed then reopened without selection)
      setTitle('');
      setContent('');
    }
  }, [announcement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcement) {
      setError("No announcement selected for editing.");
      return;
    }
    // Permission check (redundant if button is hidden correctly, but good practice)
    if (!user || !(user.id === announcement.created_by || user.is_admin)) {
      setError("You don't have permission to edit this announcement.");
      return;
    }
    if (!title.trim() || !content.trim()) {
      setError("Title and content cannot be empty.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('announcements')
        .update({
          title: title.trim(),
          content: content.trim(),
          // Optionally update an 'updated_at' timestamp if you have one
        })
        .eq('id', announcement.id); // Target the specific announcement

      if (updateError) throw updateError;

      // Success
      onClose(); // Close modal and trigger refetch on parent

    } catch (err) {
      console.error("Error updating announcement:", err);
      setError(err instanceof Error ? err.message : "Failed to update announcement.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state on close
    setError(null);
    setLoading(false);
    // Don't reset title/content here, useEffect handles it based on `announcement` prop
    onClose();
  };

  if (!isOpen || !announcement) return null; // Don't render if not open or no announcement

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-lg w-full relative">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center">Edit Announcement</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-announcement-title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="edit-announcement-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              required
            />
          </div>

          <div>
            <label htmlFor="edit-announcement-content" className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              id="edit-announcement-content"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
