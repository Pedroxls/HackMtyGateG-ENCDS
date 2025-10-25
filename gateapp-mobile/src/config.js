import { createClient } from '@supabase/supabase-js';

// Configuración
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('🔧 Config:', {
  url: SUPABASE_URL ? '✅' : '❌',
  key: SUPABASE_KEY ? '✅' : '❌',
});

// Cliente Supabase (SIN persistencia)
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// Colores
export const COLORS = {
  primary: '#1e3a8a',
  error: '#ef4444',
  text: '#1f2937',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  white: '#ffffff',
  background: '#f9fafb',
};

