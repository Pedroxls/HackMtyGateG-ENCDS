// Colores de GateApp según las guías de diseño
export const COLORS = {
  // Colores primarios
  primary: '#1e3a8a',      // Azul gategroup
  primaryLight: '#3b82f6',
  primaryDark: '#1e40af',

  // Estados
  success: '#10b981',      // Verde
  warning: '#f59e0b',      // Amarillo/Naranja
  error: '#ef4444',        // Rojo
  info: '#3b82f6',         // Azul

  // Neutrales
  neutral: '#6b7280',
  neutralLight: '#9ca3af',
  neutralDark: '#374151',

  // Backgrounds
  background: '#ffffff',
  backgroundSecondary: '#f3f4f6',
  backgroundDark: '#111827',

  // Texto
  text: '#111827',
  textSecondary: '#6b7280',
  textLight: '#9ca3af',
  textInverse: '#ffffff',

  // Bordes
  border: '#e5e7eb',
  borderDark: '#d1d5db',
};

export const DARK_COLORS = {
  ...COLORS,
  background: '#111827',
  backgroundSecondary: '#1f2937',
  text: '#f9fafb',
  textSecondary: '#d1d5db',
  border: '#374151',
};
