import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  full_name: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  is_admin?: boolean; // Add is_admin flag (optional)
}

interface AuthState {
  user: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>; // Add resetPassword signature
  refreshProfile: () => Promise<void>;
  initializeAuth: () => Promise<void>; // Keep for initial load
  setAuthUser: (authUser: any | null) => Promise<void>; // Add handler for listener
}

export const useAuthStore = create<AuthState>((set, get) => ({ // Added get back
  user: null,
  loading: true,
  initializeAuth: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, is_admin') // Fetch is_admin status
          .eq('id', user.id)
          .single();

        // Only update state if profile data has actually changed
        if (profile && JSON.stringify(profile) !== JSON.stringify(get().user)) {
          set({ user: profile });
        } else if (!profile && get().user !== null) {
          // If profile fetch failed but user was previously set, clear it
          set({ user: null });
        }
      } else if (get().user !== null) {
         // If no auth user found but user state exists, clear it
         set({ user: null });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      set({ loading: false });
    }
  },
  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, is_admin') // Fetch is_admin status
          .eq('id', data.user.id)
          .single();
        
        // Only update state if profile data has actually changed
        if (profile && JSON.stringify(profile) !== JSON.stringify(get().user)) {
          set({ user: profile });
        }
      } else if (get().user !== null) {
         // If sign in failed but user state exists, clear it (optional, depends on desired UX)
         // set({ user: null }); 
      }
    } finally {
      set({ loading: false });
    }
  },
  signUp: async (email: string, password: string, fullName: string) => {
    set({ loading: true });
    try {
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            full_name: fullName,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (profileError) throw profileError;
        // Set user state after signup, assuming it's always new data
        if (profile) { 
          set({ user: profile });
        }
      }
    } finally {
      set({ loading: false });
    }
  },
  signOut: async () => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },
  resetPassword: async (email: string) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Optional: Specify the URL to redirect the user to after clicking the reset link
        // redirectTo: 'http://localhost:5173/update-password', // Adjust if you have a specific page
      });
      if (error) throw error;
      // No state change needed here, the AuthModal will show a message
    } finally {
      set({ loading: false });
    }
  },
  refreshProfile: async () => {
    // No need to set loading here unless it's a user-initiated action
    const { data: { user: authUser } } = await supabase.auth.getUser(); // Rename to avoid conflict
    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, is_admin') // Fetch is_admin status
        .eq('id', authUser.id)
        .single();
      
      // Only update state if profile data has actually changed
      if (profile && JSON.stringify(profile) !== JSON.stringify(get().user)) {
        set({ user: profile });
      } else if (!profile && get().user !== null) {
         // If profile fetch failed but user was previously set, clear it
         set({ user: null });
      }
    } else if (get().user !== null) {
       // If no auth user found but user state exists, clear it
       set({ user: null });
    }
  },
  // New function to handle auth state changes from the listener
  setAuthUser: async (authUser) => {
    const currentState = get();
    if (authUser) {
      // User is signed in, fetch profile if different from current user or if no user exists
      if (!currentState.user || authUser.id !== currentState.user.id) {
        set({ loading: true }); // Set loading true only when fetching profile for a new/different user
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*, is_admin')
            .eq('id', authUser.id)
            .single();

          if (profile) {
            set({ user: profile, loading: false });
          } else {
             // Profile doesn't exist for the authenticated user yet (e.g., right after signup before profile insert)
             // Keep authUser basic info? Or set user to null? Setting to null for now.
             console.warn("Profile not found for authenticated user:", authUser.id);
             set({ user: null, loading: false }); 
          }
        } catch (error) {
          console.error('Error fetching profile for auth user:', error);
          set({ user: null, loading: false });
        }
      } else {
         // User is the same, ensure loading is false if it was true
         if (currentState.loading) {
             set({ loading: false });
         }
      }
    } else {
      // User is signed out
      if (currentState.user !== null) {
        set({ user: null }); // Clear user state only if it wasn't already null
      }
       // Ensure loading is false if it was true
      if (currentState.loading) {
         set({ loading: false });
      }
    }
  },
}));
