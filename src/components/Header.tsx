import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Calendar, AlertCircle } from 'lucide-react'; // Added Calendar, AlertCircle icons
import { supabase } from '../lib/supabase';
import { AuthModal } from './AuthModal';
import { ProfileDropdown } from './ProfileDropdown';
import { useAuthStore } from '../stores/authStore';

export function Header() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]); // Combined list
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  // Use the store state directly, listener in main.tsx handles updates
  const { user, loading: authLoading } = useAuthStore(); 
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Fetch notifications (announcements + upcoming registered events)
  // This now depends only on the user ID changing (login/logout)
  useEffect(() => {
    const fetchNotifications = async () => {
      // Don't show loading indicator immediately to prevent flashing
      // setLoadingNotifications(true); 
      let combinedNotifications: any[] = [];

      try {
        // 1. Fetch recent announcements (limit 3)
        const { data: announcementData, error: announcementError } = await supabase
          .from('announcements')
          .select('id, title, created_at')
          .order('created_at', { ascending: false })
          .limit(3);

        if (announcementError) console.error('Error fetching announcements:', announcementError);
        else {
          combinedNotifications = (announcementData || []).map(a => ({ ...a, type: 'announcement' }));
        }

        // 2. Fetch upcoming registered events (next 7 days) for logged-in user
        if (user?.id) {
          const today = new Date();
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);

          const { data: eventRegData, error: eventRegError } = await supabase
            .from('event_registrations')
            .select(`
              event:events (
                id,
                title,
                date,
                time
              )
            `)
            .eq('user_id', user.id)
            .gte('events.date', today.toISOString().split('T')[0]) // Event date >= today
            .lte('events.date', nextWeek.toISOString().split('T')[0]); // Event date <= next week

          if (eventRegError) console.error('Error fetching registered events:', eventRegError);
          else {
             const upcomingEvents = (eventRegData || [])
               .map(reg => reg.event?.[0]) // Supabase might return join as array
               .filter(event => !!event) // Filter out nulls
               .map(event => ({ ...event, type: 'event' }));
             combinedNotifications = [...combinedNotifications, ...upcomingEvents];
          }
        }

        // Sort combined list
        combinedNotifications.sort((a, b) => {
            const dateA = new Date(a.type === 'announcement' ? a.created_at : a.date).getTime();
            const dateB = new Date(b.type === 'announcement' ? b.created_at : b.date).getTime();
            return dateB - dateA; // Show newest first generally
        });

        setNotifications(combinedNotifications.slice(0, 7)); // Limit total notifications shown

      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]); // Clear on error
      } finally {
        // setLoadingNotifications(false); // Loading state might not be needed here anymore
      }
    };

    // Fetch notifications only when user ID changes (login/logout)
    fetchNotifications();

  }, [user?.id]); // Depend only on user ID

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationsRef]);

  const handleAuthClick = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <header className="bg-white bg-opacity-90 shadow-sm backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-indigo-600">
              Campus Connect {/* Reverted text and removed logo img tag */}
            </Link>
            <div className="flex items-center space-x-4 relative">
              {/* Notifications Bell & Dropdown */}
              <div ref={notificationsRef}> {/* Wrap bell and dropdown */}
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} // Toggle dropdown
                  className="p-2 hover:bg-gray-100 rounded-full relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {/* Optional: Add a badge for unread count later */}
                  {/* <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-400" /> */}
                </button>

                {/* Dropdown Menu */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
                    <div className="py-2 px-4 font-semibold text-gray-700 border-b">Notifications</div>
                    <ul className="max-h-80 overflow-y-auto"> {/* Increased max height */}
                      {loadingNotifications ? ( // Still useful to show loading within dropdown
                         <li className="px-4 py-3 text-sm text-gray-500">Loading...</li>
                      ) : notifications.length > 0 ? (
                        notifications.map((item) => (
                          <li key={`${item.type}-${item.id}`} className="border-b last:border-b-0">
                            <Link
                              to={item.type === 'event' ? `/events/${item.id}` : '/announcements'}
                              onClick={() => setIsNotificationsOpen(false)}
                              className="block px-4 py-3 hover:bg-gray-100"
                            >
                              <div className="flex items-center space-x-2">
                                {item.type === 'event' ? (
                                  <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0"/>
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0"/>
                                )}
                                <p className="text-sm font-medium text-gray-900 truncate">{item.title || item.name}</p> {/* Use title or name */}
                              </div>
                              <p className="text-xs text-gray-500 mt-1 pl-6">
                                {item.type === 'event'
                                  ? `Event on: ${new Date(item.date).toLocaleDateString()} at ${item.time || ''}`
                                  : `Posted: ${new Date(item.created_at).toLocaleDateString()}`
                                }
                              </p>
                            </Link>
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-3 text-sm text-gray-500">No notifications.</li>
                      )}
                    </ul>
                     {/* Optional: Add View All link if needed */}
                     {/* <div className="py-2 px-4 border-t text-center">...</div> */}
                  </div>
                )}
              </div>

              {/* Auth Buttons / Profile Dropdown */}
              {authLoading ? ( // Use authLoading from store
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
              ) : user ? (
                <ProfileDropdown />
              ) : (
                <>
                  <button
                    onClick={() => handleAuthClick('signin')}
                    className="text-indigo-600 hover:text-indigo-700 px-4 py-2"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
