import { create } from 'zustand';
import { supabase } from './config';

// Store SIMPLE de autenticación
export const useAuth = create((set) => ({
  user: null,
  loading: false,
  
  // Login
  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      set({ user: data.user, loading: false });
      console.log('✅ Login OK');
    } catch (error) {
      set({ loading: false });
      console.error('❌ Login error:', error.message);
      throw error;
    }
  },
  
  // Logout
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
    console.log('✅ Logout OK');
  },
  
  // Check auth
  checkAuth: async () => {
    set({ loading: true });
    try {
      const { data } = await supabase.auth.getUser();
      set({ user: data.user, loading: false });
      console.log('✅ Auth check:', data.user ? data.user.email : 'No user');
    } catch (error) {
      set({ user: null, loading: false });
      console.log('❌ No session');
    }
  },
}));

