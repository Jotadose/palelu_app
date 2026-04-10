// Firebase config con fallback para desarrollo
// Las variables se cargan desde .env en desarrollo
// y desde Variables de Entorno en Vercel (Production)

// Valores por defecto para desarrollo local (no se suben a producción)
const devConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  measurementId: "G-DEMO123"
};

// Valores de producción (se configurarán en Vercel)
const prodConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Usar config de producción si está disponible, si no usar fallback
const isProd = import.meta.env.VITE_FIREBASE_PROJECT_ID && 
               import.meta.env.VITE_FIREBASE_PROJECT_ID !== "demo-project";

export const firebaseConfig = isProd ? prodConfig : devConfig;