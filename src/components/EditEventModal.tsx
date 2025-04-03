import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { X, Upload } from 'lucide-react'; // Added Upload

// Re-use or define the Event interface
interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  club_id: string | null; // Allow null if event is not club-specific
  capacity: number;
  image_url: string;
  created_by?: string;
  category?: string; // Include category if editable
}

// Interface for Club data (for dropdown)
interface Club {
  id: string;
  name: string;
}

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null; // Event to edit
}

export function EditEventModal({ isOpen, onClose, event }: EditEventModalProps) {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState<number | string>(''); // Allow string for input
  const [imageUrl, setImageUrl] = useState(''); // Keep existing URL state for display/fallback
  const [imageFile, setImageFile] = useState<File | null>(null); // State for new file selection
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]); // For club dropdown
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch clubs for the dropdown
  useEffect(() => {
    async function fetchClubs() {
      // Fetch clubs the user might be associated with or all clubs if admin?
      // For simplicity, let's fetch all clubs for now. Adjust RLS if needed.
      try {
        const { data, error: fetchError } = await supabase
          .from('clubs')
          .select('id, name');
        if (fetchError) throw fetchError;
        setClubs(data || []);
      } catch (err) {
        console.error("Error fetching clubs for modal:", err);
        // Handle error - maybe disable club selection?
      }
    }
    if (isOpen) { // Only fetch when modal is open
        fetchClubs();
    }
  }, [isOpen]);


  // Pre-fill form when event data changes (modal opens)
  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setDate(event.date || ''); // Assumes date is stored as 'YYYY-MM-DD'
      setTime(event.time || '');
      setLocation(event.location || '');
      setCapacity(event.capacity?.toString() || ''); // Convert number to string for input
      setImageUrl(event.image_url || ''); // Keep track of the original/current URL
      setImageFile(null); // Reset file input on new event load
      setSelectedClubId(event.club_id || null);
      // TODO: Handle category if it's part of the event and editable
    } else {
      // Reset if no event is passed
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
      setLocation('');
      setCapacity('');
      setImageUrl('');
      setSelectedClubId(null);
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) {
      setError("No event selected for editing.");
      return;
    }
    // Permission check
    if (!user || !(user.id === event.created_by || user.is_admin)) {
      setError("You don't have permission to edit this event.");
      return;
    }
    if (!title.trim() || !date || !time || !location.trim() || !capacity) {
      setError("Please fill in all required fields (Title, Date, Time, Location, Capacity).");
      return;
    }

    const capacityNum = parseInt(String(capacity), 10);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      setError("Capacity must be a positive number.");
        return;
    }

    setLoading(true);
    setError(null);

    let finalImageUrl = event.image_url; // Start with the existing image URL

    // --- File Upload Logic (if new file selected) ---
    if (imageFile) {
       const fileExt = imageFile.name.split('.').pop();
       const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
       const filePath = `events/${user.id}/${fileName}`; // Consistent path structure

       try {
         // TODO: Optionally delete the old image from storage first if event.image_url exists
         // This requires parsing the old URL to get the file path, which can be complex.
         // For simplicity, we'll just upload the new one. Old ones might remain in storage.

         const { error: uploadError } = await supabase.storage
           .from('event_images')
           .upload(filePath, imageFile);

         if (uploadError) throw new Error(`New image upload failed: ${uploadError.message}`);

         const { data: urlData } = supabase.storage
           .from('event_images')
           .getPublicUrl(filePath);

         if (!urlData?.publicUrl) throw new Error("Could not get public URL for new image.");
         finalImageUrl = urlData.publicUrl; // Update the URL to be saved
         console.log("Uploaded new image URL:", finalImageUrl);

       } catch (uploadErr) {
          console.error("Upload error:", uploadErr);
          setError(uploadErr instanceof Error ? uploadErr.message : "Failed to upload new image.");
          setLoading(false);
          return; // Stop if upload fails
       }
    }
    // --- End File Upload Logic ---

    // --- Database Update Logic ---
    try {
      const { error: updateError } = await supabase
        .from('events')
        .update({
          title: title.trim(),
          description: description.trim(),
          date: date,
          time: time,
          location: location.trim(),
          capacity: capacityNum,
          image_url: finalImageUrl, // Use the potentially updated URL
          club_id: selectedClubId,
          // updated_at: new Date().toISOString(), // Optional
        })
        .eq('id', event.id); // Target the specific event

      if (updateError) throw updateError;

      // Success
      onClose(); // Close modal and trigger refetch on parent

    } catch (err) {
      console.error("Error updating event:", err);
      setError(err instanceof Error ? err.message : "Failed to update event.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setLoading(false);
    // Form state is reset by useEffect when `event` becomes null
    onClose();
  };

  if (!isOpen || !event) return null;

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

        <h2 className="text-2xl font-bold mb-6 text-center">Edit Event</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="edit-event-title" className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" id="edit-event-title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" required />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="edit-event-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea id="edit-event-description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-event-date" className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" id="edit-event-date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" required />
            </div>
            <div>
              <label htmlFor="edit-event-time" className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
              <input type="time" id="edit-event-time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" required />
            </div>
          </div>

          {/* Location & Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-event-location" className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <input type="text" id="edit-event-location" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" required />
            </div>
            <div>
              <label htmlFor="edit-event-capacity" className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
              <input type="number" id="edit-event-capacity" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" min="1" required />
            </div>
          </div>

           {/* Club Association */}
           <div>
             <label htmlFor="edit-event-club" className="block text-sm font-medium text-gray-700 mb-1">Associated Club (Optional)</label>
             <select
               id="edit-event-club"
               value={selectedClubId ?? ''} // Handle null value for select
               onChange={(e) => setSelectedClubId(e.target.value || null)} // Set to null if default option selected
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
             >
               <option value="">-- No specific club --</option>
               {clubs.map((club) => (
                 <option key={club.id} value={club.id}>
                   {club.name}
                 </option>
               ))}
             </select>
           </div>

          {/* Image Upload / URL */}
          <div>
            <label htmlFor="edit-imageFile" className="block text-sm font-medium text-gray-700 mb-1">
              Cover Image (Upload new to replace)
            </label>
            {/* Display current image if exists */}
            {imageUrl && !imageFile && (
                <div className="mb-2">
                    <img src={imageUrl} alt="Current event cover" className="max-h-20 rounded border"/>
                    <span className="text-xs text-gray-500 ml-2">(Current Image)</span>
                </div>
            )}
            <div className="mt-1 flex items-center space-x-2">
               <label htmlFor="edit-imageFile" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 inline-flex items-center">
                 <Upload className="w-4 h-4 mr-2"/>
                 Choose New File
               </label>
               <input
                 type="file"
                 id="edit-imageFile"
                 accept="image/png, image/jpeg, image/gif"
                 onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                 className="sr-only"
               />
               {imageFile && <span className="text-sm text-gray-600 truncate">{imageFile.name}</span>}
               {!imageFile && !imageUrl && <span className="text-sm text-gray-500">No image uploaded.</span>}
            </div>
             <p className="text-xs text-gray-500 mt-1">Upload a new image to replace the current one (if any).</p>
          </div>

          {/* TODO: Add Category field if needed */}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Saving...' : 'Save Event Changes'}
            </button>
          </div>
        </form>
      </div>
      {/* Removed invalid <style jsx> block */}
    </div>
  );
}
