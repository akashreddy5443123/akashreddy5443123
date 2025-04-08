import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { X } from 'lucide-react';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAnnouncementModal({ isOpen, onClose }: CreateAnnouncementModalProps) {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState(''); // Changed state name from content to message
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.is_admin) {
      setError("You don't have permission to create announcements.");
      return;
    }
    if (!title.trim() || !message.trim()) { // Check message state
      setError("Title and message cannot be empty.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('announcements')
        .insert({
          title: title.trim(),
          message: message.trim(), // Use message column
          created_by: user.id // Set the creator
        });

      if (insertError) throw insertError;

      // Success
      setTitle('');
      setMessage(''); // Reset message state
      onClose(); // Close modal and trigger refetch on parent

    } catch (err) {
      console.error("Error creating announcement:", err);
      setError(err instanceof Error ? err.message : "Failed to create announcement.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state on close
    setTitle('');
    setMessage(''); // Reset message state
    setError(null);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

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

        <h2 className="text-2xl font-bold mb-6 text-center">Create New Announcement</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="announcement-title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="announcement-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              placeholder="Important Update"
              required
            />
          </div>

          <div>
            <label htmlFor="announcement-message" className="block text-sm font-medium text-gray-700 mb-1">
              Message {/* Changed label */}
            </label>
            <textarea
              id="announcement-message" // Changed id
              rows={6}
              value={message} // Use message state
              onChange={(e) => setMessage(e.target.value)} // Update message state
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              placeholder="Details about the announcement..."
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
              {loading ? 'Creating...' : 'Create Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
