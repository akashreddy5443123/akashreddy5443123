import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { LogOut, User, Settings, LayoutDashboard } from 'lucide-react'; // Add LayoutDashboard
import { useAuthStore } from '../stores/authStore';
import { EditProfileModal } from './EditProfileModal';

export function ProfileDropdown() {
  const { user, signOut } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!user) return null;

  const initials = user.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
      >
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
          {user.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt={user.full_name || ''} 
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-white">{initials}</span>
          )}
        </div>
        <span className="font-medium">{user.full_name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
          <div className="px-4 py-2 text-sm text-gray-900 border-b">
            <div className="font-medium truncate">{user.full_name}</div>
            <div className="text-gray-500 truncate text-xs">{user.bio || 'No bio yet'}</div>
          </div>
          
          <button
            onClick={() => {
              setIsEditModalOpen(true);
              setIsOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <Settings className="w-4 h-4 inline-block mr-2" />
            Edit Profile
          </button>

          {/* Conditionally render Admin Dashboard link */}
          {user?.is_admin && (
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)} // Close dropdown on click
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <LayoutDashboard className="w-4 h-4 inline-block mr-2" />
              Admin Dashboard
            </Link>
          )}
          
          <button
            onClick={async () => {
              await signOut();
              setIsOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="w-4 h-4 inline-block mr-2" />
            Sign Out
          </button>
        </div>
      )}

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
}
