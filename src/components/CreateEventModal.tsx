import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react'; // Added Upload icon
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore'; // Import auth store

interface Club {
  id: string;
  name: string;
}

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateEventModal({ isOpen, onClose }: CreateEventModalProps) {
  const { user } = useAuthStore(); // Get user from store
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [clubId, setClubId] = useState('');
  const [capacity, setCapacity] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null); // State for the selected file
  const [clubs, setClubs] = useState<Club[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch clubs user can associate event with (e.g., clubs they created)
  useEffect(() => {
    async function fetchUserClubs() {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('clubs')
          .select('id, name')
          .eq('created_by', user.id); // Only show clubs created by the user
        if (data) setClubs(data);
      } catch (err) {
        console.error("Error fetching user's clubs:", err);
      }
    }

    if (isOpen) {
        fetchUserClubs();
    } else {
        // Reset form when modal closes
        setTitle('');
        setDescription('');
        setDate('');
        setTime('');
        setLocation('');
        setClubId('');
        setCapacity('');
        setImageFile(null);
        setError(null);
        setLoading(false);
    }
  }, [isOpen, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    } else {
      setImageFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!user) {
      setError('You must be logged in to create an event.');
      setLoading(false);
      return;
    }

    let uploadedImageUrl: string | null = null;

    // --- File Upload Logic ---
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      // Use user ID in path for organization and RLS policy matching
      const filePath = `events/${user.id}/${fileName}`; 

      try {
        const { error: uploadError } = await supabase.storage
          .from('event_images') // Bucket name
          .upload(filePath, imageFile);

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('event_images')
          .getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
          throw new Error("Could not get public URL for uploaded image.");
        }
        uploadedImageUrl = urlData.publicUrl;
        console.log("Uploaded image URL:", uploadedImageUrl);

      } catch (uploadErr) {
        console.error("Upload error:", uploadErr);
        setError(uploadErr instanceof Error ? uploadErr.message : "Failed to upload image.");
        setLoading(false);
        return; // Stop if upload fails
      }
    }
    // --- End File Upload Logic ---

    // --- Database Insert Logic ---
    try {
      const capacityNum = parseInt(capacity, 10);
      if (isNaN(capacityNum)) throw new Error("Capacity must be a number.");

      const { error: insertError } = await supabase
        .from('events')
        .insert([{
          title: title.trim(),
          description: description.trim(),
          date,
          time,
          location: location.trim(),
          club_id: clubId || null, // Use null if no club selected
          capacity: capacityNum,
          image_url: uploadedImageUrl, // Use the URL from storage upload or null
          created_by: user.id
        }]);

      if (insertError) throw insertError;

      // Success - close modal (form reset is handled by useEffect on isOpen change)
      onClose();

    } catch (err) {
      console.error("Database insert error:", err);
      setError(err instanceof Error ? err.message : 'An error occurred creating the event.');
      // Consider deleting the uploaded image if DB insert fails
      if (uploadedImageUrl) {
          // TODO: Add logic to delete image from storage on DB error
          console.warn("DB insert failed after image upload. Consider implementing cleanup.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full relative my-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center">Create New Event</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Event Title *</label>
            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" required />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-field" />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date *</label>
              <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700">Time *</label>
              <input type="time" id="time" value={time} onChange={(e) => setTime(e.target.value)} className="input-field" required />
            </div>
          </div>

          {/* Location & Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location *</label>
              <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Capacity *</label>
              <input type="number" id="capacity" value={capacity} onChange={(e) => setCapacity(e.target.value)} min="1" className="input-field" required />
            </div>
          </div>

          {/* Club Association */}
          <div>
            <label htmlFor="club" className="block text-sm font-medium text-gray-700">Associated Club (Optional)</label>
            <select id="club" value={clubId} onChange={(e) => setClubId(e.target.value)} className="input-field">
              <option value="">-- Select a club --</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Only shows clubs you have created.</p>
          </div>

          {/* Image Upload */}
          <div>
            <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700">Cover Image (Optional)</label>
            <div className="mt-1 flex items-center space-x-2">
              <label htmlFor="imageFile" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 inline-flex items-center">
                <Upload className="w-4 h-4 mr-2"/>
                Choose File
              </label>
              <input type="file" id="imageFile" accept="image/png, image/jpeg, image/gif" onChange={handleFileChange} className="sr-only" />
              {imageFile && <span className="text-sm text-gray-600 truncate">{imageFile.name}</span>}
            </div>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF recommended.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}>
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
      {/* Removed invalid <style jsx> block */}
    </div>
  );
}
