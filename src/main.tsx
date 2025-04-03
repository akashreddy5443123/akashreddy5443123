import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { supabase } from './lib/supabase'; // Import supabase client
import { useAuthStore } from './stores/authStore'; // Import auth store

// Initialize auth state once on load before setting up listener
useAuthStore.getState().initializeAuth();

// Set up the auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`[main.tsx] Auth state changed: Event - ${event}`, session ? `Session User ID - ${session.user.id}` : 'No session'); // More detailed log
  // Use the new store action to handle the change
  useAuthStore.getState().setAuthUser(session?.user ?? null);
});


const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
