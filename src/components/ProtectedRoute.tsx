import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  isAdminRoute?: boolean; // Flag to check for admin status
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ isAdminRoute = false }) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    // Optional: Show a loading indicator while auth state is being determined
    return <div>Loading...</div>; 
  }

  if (!user) {
    // Not logged in, redirect to home or login page
    return <Navigate to="/" replace />;
  }

  if (isAdminRoute && !user.is_admin) {
    // Logged in but not an admin, redirect to home
    console.warn("Access denied: User is not an admin.");
    return <Navigate to="/" replace />;
  }

  // User is authenticated (and is admin if required), render the child route component
  return <Outlet />;
};
