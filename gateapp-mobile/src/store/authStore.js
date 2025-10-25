import { create } from 'zustand';
import { supabase } from '../services/supabase';

export const useAuthStore = create((set, get) => ({
  // Estado
  user: null,
  session: null,
  loading: true,
  error: null,

  // Inicializar sesión
  initialize: async () => {
    try {
      set({ loading: true, error: null });

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      set({
        session,
        user: session?.user ?? null,
        loading: false
      });

      // Escuchar cambios en la autenticación
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null
        });
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Error al inicializar sesión:', error);
    }
  },

  // Login con email y password
  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      set({
        user: data.user,
        session: data.session,
        loading: false,
        error: null
      });

      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Error en signIn:', error);
      return { success: false, error: error.message };
    }
  },

  // Registro con email y password
  signUp: async (email, password, metadata = {}) => {
    try {
      set({ loading: true, error: null });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) throw error;

      set({
        user: data.user,
        session: data.session,
        loading: false,
        error: null
      });

      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Error en signUp:', error);
      return { success: false, error: error.message };
    }
  },

  // Cerrar sesión
  signOut: async () => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      set({
        user: null,
        session: null,
        loading: false,
        error: null
      });

      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Error en signOut:', error);
      return { success: false, error: error.message };
    }
  },

  // Reset password
  resetPassword: async (email) => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;

      set({ loading: false, error: null });
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Error en resetPassword:', error);
      return { success: false, error: error.message };
    }
  },

  // Limpiar error
  clearError: () => set({ error: null }),
}));
