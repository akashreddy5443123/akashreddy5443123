import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { X } from 'lucide-react';

// Re-use or define the Club interface
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
  created_by?: string;
}

interface EditClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  club: Club | null; // Club to edit
}

export function EditClubModal({ isOpen, onClose, club }: EditClubModalProps) {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill form when club data changes
  useEffect(() => {
    if (club) {
      setName(club.name || '');
      setDescription(club.description || '');
      setCategory(club.category || '');
      setMeetingTime(club.meeting_time || '');
      setLocation(club.location || '');
      setEmail(club.email || '');
      setWebsite(club.website || '');
      setImageUrl(club.image_url || '');
    } else {
      // Reset if no club is passed
      setName('');
      setDescription('');
      setCategory('');
      setMeetingTime('');
      setLocation('');
      setEmail('');
      setWebsite('');
      setImageUrl('');
    }
  }, [club]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club) {
      setError("No club selected for editing.");
      return;
    }
    // Permission check
    if (!user || !(user.id === club.created_by || user.is_admin)) {
      setError("You don't have permission to edit this club.");
      return;
    }
    if (!name.trim()) {
      setError("Club name cannot be empty.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('clubs')
        .update({
          name: name.trim(),
          description: description.trim(),
          category: category.trim(),
          meeting_time: meetingTime.trim(),
          location: location.trim(),
          email: email.trim(),
          website: website.trim(),
          image_url: imageUrl.trim(),
          // updated_at: new Date().toISOString(), // Optional
        })
        .eq('id', club.id); // Target the specific club

      if (updateError) throw updateError;

      // Success
      onClose(); // Close modal and trigger refetch on parent

    } catch (err) {
      console.error("Error updating club:", err);
      setError(err instanceof Error ? err.message : "Failed to update club.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setLoading(false);
    onClose();
  };

  if (!isOpen || !club) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full relative my-8">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center">Edit Club</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="edit-club-name" className="block text-sm font-medium text-gray-700 mb-1">Club Name *</label>
            <input type="text" id="edit-club-name" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="edit-club-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea id="edit-club-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" />
          </div>

          {/* Category & Meeting Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-club-category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input type="text" id="edit-club-category" value={category} onChange={(e) => setCategory(e.target.value)} className="input-field" />
            </div>
            <div>
              <label htmlFor="edit-club-meeting-time" className="block text-sm font-medium text-gray-700 mb-1">Meeting Time</label>
              <input type="text" id="edit-club-meeting-time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} className="input-field" placeholder="e.g., Wednesdays 6 PM" />
            </div>
          </div>

          {/* Location & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-club-location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" id="edit-club-location" value={location} onChange={(e) => setLocation(e.target.value)} className="input-field" />
            </div>
            <div>
              <label htmlFor="edit-club-email" className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input type="email" id="edit-club-email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
            </div>
          </div>

          {/* Website & Image URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-club-website" className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
              <input type="url" id="edit-club-website" value={website} onChange={(e) => setWebsite(e.target.value)} className="input-field" placeholder="https://..." />
            </div>
            <div>
              <label htmlFor="edit-club-image-url" className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input type="url" id="edit-club-image-url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="input-field" placeholder="https://..." />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Saving...' : 'Save Club Changes'}
            </button>
          </div>
        </form>
      </div>
      {/* Removed invalid <style jsx> block */}
    </div>
  );
}
