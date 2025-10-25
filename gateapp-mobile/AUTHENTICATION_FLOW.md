# 🔐 Flujo de Autenticación - GateApp Mobile

## 📊 Diagrama del Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                    1. APP INICIA                            │
│                    app/_layout.jsx                          │
│                                                             │
│  useEffect(() => {                                          │
│    initialize(); // Inicializa authStore                    │
│  })                                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              2. INICIALIZACIÓN AUTH                         │
│              src/store/authStore.js                         │
│                                                             │
│  initialize: async () => {                                  │
│    const { session } = await supabase.auth.getSession();   │
│    set({ user: session?.user, loading: false });           │
│  }                                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                3. PUNTO DE ENTRADA                          │
│                app/index.jsx                                │
│                                                             │
│  useEffect(() => {                                          │
│    if (!loading) {                                          │
│      if (user) {                                            │
│        router.replace('/dashboard'); ──────┐               │
│      } else {                               │               │
│        router.replace('/login'); ───┐      │               │
│      }                               │      │               │
│    }                                 │      │               │
│  }, [user, loading])                 │      │               │
└──────────────────────────────────────┼──────┼───────────────┘
                                       │      │
                     ┌─────────────────┘      │
                     ▼                        │
┌─────────────────────────────────────────┐  │
│         4A. SIN SESIÓN                  │  │
│         app/login.jsx                   │  │
│         LoginScreen.jsx                 │  │
│                                         │  │
│  Usuario ingresa:                       │  │
│  - Email                                │  │
│  - Password                             │  │
│                                         │  │
│  Click "Iniciar Sesión"                 │  │
│    ↓                                    │  │
│  handleLogin() {                        │  │
│    const result = await signIn(...);    │  │
│    if (result.success) {                │  │
│      router.replace('/dashboard'); ─────┼──┘
│    }                                    │
│  }                                      │
└─────────────────────────────────────────┘

                     ┌──────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              4B. CON SESIÓN                                 │
│              app/dashboard.jsx                              │
│              DashboardScreen.jsx                            │
│                                                             │
│  Usuario ve:                                                │
│  - Estadísticas                                             │
│  - Acciones rápidas                                         │
│  - Actividad reciente                                       │
│  - Botón "Salir"                                            │
│                                                             │
│  Click en "Salir" ──────────┐                               │
│                              ▼                              │
│  handleLogout() {                                           │
│    Alert.alert("¿Cerrar sesión?")                           │
│    onPress: async () => {                                   │
│      await signOut();                                       │
│      router.replace('/login'); ◄─── ¡ARREGLADO!            │
│    }                                                        │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo Detallado Paso a Paso

### 1️⃣ Inicio de la App

**Archivo**: `app/_layout.jsx`

```jsx
export default function RootLayout() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize(); // ← Verifica si hay sesión guardada
  }, []);

  return <Slot />;
}
```

**¿Qué hace?**
- Llama a `initialize()` del authStore
- Verifica si hay una sesión en AsyncStorage
- Actualiza el estado `user` y `loading`

---

### 2️⃣ Verificación de Sesión

**Archivo**: `src/store/authStore.js`

```jsx
initialize: async () => {
  set({ loading: true });

  const { data: { session } } = await supabase.auth.getSession();

  set({
    session,
    user: session?.user ?? null,
    loading: false
  });
}
```

**Posibles resultados:**
- ✅ **Hay sesión** → `user = { id, email, ... }`
- ❌ **No hay sesión** → `user = null`

---

### 3️⃣ Redirección Automática

**Archivo**: `app/index.jsx`

```jsx
export default function Index() {
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard'); // ← Usuario autenticado
      } else {
        router.replace('/login');      // ← Usuario NO autenticado
      }
    }
  }, [user, loading]);

  return <ActivityIndicator />; // ← Mientras verifica
}
```

**¿Qué hace?**
- Espera a que termine `initialize()` (`loading = false`)
- Si hay `user` → va a `/dashboard`
- Si NO hay `user` → va a `/login`

---

### 4️⃣ Pantalla de Login

**Archivo**: `src/features/auth/LoginScreen.jsx`

```jsx
const handleLogin = async () => {
  if (!validateForm()) return;

  const result = await signIn(email, password);

  if (result.success) {
    router.replace('/dashboard'); // ← Redirige al dashboard
  } else {
    Alert.alert('Error', result.error);
  }
};
```

**Flujo:**
1. Usuario ingresa email y password
2. Presiona "Iniciar Sesión"
3. `handleLogin()` valida el formulario
4. Llama a `signIn()` del authStore
5. Si es exitoso → actualiza `user` en el store
6. Redirige a `/dashboard`

**AuthStore - signIn():**
```jsx
signIn: async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { success: false, error: error.message };

  set({
    user: data.user,      // ← Actualiza el estado
    session: data.session,
    loading: false,
  });

  return { success: true };
}
```

---

### 5️⃣ Pantalla de Dashboard

**Archivo**: `src/features/dashboard/DashboardScreen.jsx`

```jsx
const handleLogout = () => {
  Alert.alert(
    'Cerrar Sesión',
    '¿Estás seguro?',
    [
      { text: 'Cancelar' },
      {
        text: 'Cerrar Sesión',
        onPress: async () => {
          await signOut();
          router.replace('/login'); // ← ✅ ARREGLADO!
        },
      },
    ]
  );
};
```

**Flujo:**
1. Usuario presiona "Salir"
2. Aparece confirmación (Alert)
3. Si confirma → llama `signOut()`
4. Limpia la sesión en Supabase
5. Limpia `user` en el store
6. **Redirige a `/login`** ← Este era el problema!

**AuthStore - signOut():**
```jsx
signOut: async () => {
  await supabase.auth.signOut();

  set({
    user: null,      // ← Limpia el usuario
    session: null,
    loading: false,
  });

  return { success: true };
}
```

---

## 🐛 Problema que se arregló

### ❌ Antes (NO FUNCIONABA)

```jsx
// DashboardScreen.jsx
const handleLogout = () => {
  Alert.alert('Cerrar Sesión', '...', [
    {
      text: 'Cerrar Sesión',
      onPress: async () => {
        await signOut();
        // ❌ NO REDIRIGÍA! Se quedaba en dashboard
      },
    },
  ]);
};
```

**Problema:**
- `signOut()` limpiaba el `user` del store
- Pero NO redirigía a `/login`
- El usuario veía el dashboard vacío o con error

### ✅ Ahora (FUNCIONA)

```jsx
// DashboardScreen.jsx
const handleLogout = () => {
  Alert.alert('Cerrar Sesión', '...', [
    {
      text: 'Cerrar Sesión',
      onPress: async () => {
        await signOut();
        router.replace('/login'); // ← ✅ Redirige explícitamente!
      },
    },
  ]);
};
```

**Solución:**
- Agregamos `router.replace('/login')` después de `signOut()`
- Ahora redirige inmediatamente a login

---

## 🔐 Persistencia de Sesión

### Cómo funciona

**Supabase + AsyncStorage:**

1. **Primer login:**
   ```
   signIn() → Supabase guarda token en AsyncStorage
   ```

2. **App se cierra y reabre:**
   ```
   initialize() → Lee token de AsyncStorage
              → Valida con Supabase
              → Si es válido, restaura sesión
              → user = {...}
   ```

3. **Sign out:**
   ```
   signOut() → Borra token de AsyncStorage
            → user = null
   ```

### Archivo de configuración

**src/services/supabase.js:**
```jsx
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,      // ← Guarda tokens aquí
    autoRefreshToken: true,      // ← Refresca automáticamente
    persistSession: true,        // ← Persiste entre sesiones
    detectSessionInUrl: false,
  },
});
```

---

## 🎯 Resumen del Flujo Completo

### Usuario Nuevo (Sin Sesión)
```
App inicia
  → initialize() → user = null
  → index.jsx detecta user = null
  → Redirige a /login
  → Usuario ingresa credenciales
  → signIn() exitoso → user = {...}
  → Redirige a /dashboard
  → Usuario ve su dashboard ✅
```

### Usuario Regresa (Con Sesión)
```
App inicia
  → initialize() → Lee AsyncStorage
  → Valida con Supabase
  → user = {...} (sesión restaurada)
  → index.jsx detecta user = {...}
  → Redirige a /dashboard directamente
  → Usuario ve su dashboard ✅
```

### Usuario hace Sign Out
```
Usuario en dashboard
  → Presiona "Salir"
  → Confirma en Alert
  → signOut() → user = null
  → router.replace('/login')
  → Usuario ve login ✅
```

---

## 📝 Archivos Involucrados

| Archivo | Responsabilidad |
|---------|-----------------|
| `app/_layout.jsx` | Inicializa auth al iniciar |
| `app/index.jsx` | Redirige según estado de auth |
| `app/login.jsx` | Ruta de login |
| `app/dashboard.jsx` | Ruta de dashboard |
| `src/store/authStore.js` | Estado global de auth |
| `src/services/supabase.js` | Cliente de Supabase |
| `src/features/auth/LoginScreen.jsx` | UI de login |
| `src/features/dashboard/DashboardScreen.jsx` | UI de dashboard |

---

## ✅ Estado Actual

- ✅ **Login**: Funciona
- ✅ **Logout**: Funciona (arreglado!)
- ✅ **Redirección automática**: Funciona
- ✅ **Persistencia de sesión**: Funciona
- ✅ **Loading states**: Funciona
- ✅ **Manejo de errores**: Funciona

---

## 🚀 Próximos Pasos

Para mejorar el flujo (opcional):

1. **Agregar guards de ruta**
   - Proteger `/dashboard` para solo usuarios autenticados

2. **Agregar refresh token automático**
   - Ya está configurado en Supabase

3. **Agregar "Recordarme"**
   - Checkbox en login para sesiones largas

4. **Agregar recuperación de contraseña**
   - Usar `resetPassword()` del authStore

---

**Todo funciona correctamente! 🎉**
