// src/context/AuthContext.jsx
// Contexto simple de autenticación para prototipo (NO usar así en producción).
// Guarda sesión en localStorage y expone login, register y logout.

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Estado: usuario actual (null si no hay sesión)
  const [user, setUser] = useState(null);

  // Cargar sesión al iniciar
  useEffect(() => {
    const raw = localStorage.getItem('auth_user');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  // Simulación de base de usuarios (solo para demo)
  const readUsers = () => JSON.parse(localStorage.getItem('auth_users') || '[]');
  const writeUsers = (arr) => localStorage.setItem('auth_users', JSON.stringify(arr));

  // Iniciar sesión
  const login = async ({ email, password }) => {
    const users = readUsers();
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) throw new Error('Correo o contraseña inválidos');
    const sessionUser = { name: found.name, email: found.email };
    localStorage.setItem('auth_user', JSON.stringify(sessionUser));
    setUser(sessionUser);
    return sessionUser;
  };

  // Registrar y entrar
  const register = async ({ name, email, password }) => {
    const users = readUsers();
    if (users.some(u => u.email === email)) {
      throw new Error('Este correo ya está registrado');
    }
    const newUser = { name, email, password }; // ⚠️ Solo demo
    users.push(newUser);
    writeUsers(users);
    const sessionUser = { name, email };
    localStorage.setItem('auth_user', JSON.stringify(sessionUser));
    setUser(sessionUser);
    return sessionUser;
  };

  // Cerrar sesión
  const logout = () => {
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, register, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook de conveniencia
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

// Componente para proteger rutas
export function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) {
    // Devolvemos un "fallback" mínimo; la redirección la haremos en App con <Navigate/>
    return null;
  }
  return children;
}
