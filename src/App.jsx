import React, { useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, setLogLevel } from "firebase/firestore";

// Configuración
import { firebaseConfig } from "./firebaseConfig";

// Contexts
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { CashSessionProvider } from "./contexts/CashSessionContext";

// Pages
import { LoginPage } from "./pages/LoginPage";
import { SalesPage } from "./pages/SalesPage";
import { InventoryPage } from "./pages/InventoryPage";
import { CashRegisterPage } from "./pages/CashRegisterPage";

// Components
import {
  ShoppingCartIcon,
  PackageIcon,
  LogOutIcon,
  CashRegisterIcon,
} from "./components/Icons";

// --- Inicialización de Firebase ---
let app, db, appId;
try {
  appId = firebaseConfig.appId;
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  setLogLevel("error");
} catch (error) {
  console.error("Error al inicializar Firebase.", error);
}

// Botón de navegación inferior (móvil)
const BottomNavButton = ({ active, onClick, icon: Icon, label, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition-all touch-target haptic-feedback ${
      active
        ? "text-secondary"
        : disabled
        ? "text-gray-300 cursor-not-allowed"
        : "text-gray-500"
    }`}
  >
    <div className={`p-1.5 rounded-xl transition-all ${active ? "bg-secondary/10" : ""}`}>
      <Icon className={`w-6 h-6 ${active ? "scale-110" : ""}`} />
    </div>
    <span className={`text-[10px] mt-0.5 font-medium ${active ? "text-secondary" : ""}`}>
      {label}
    </span>
  </button>
);

// Contenido principal de la app
const AppContent = () => {
  const { user, logout } = useAuth();
  const [page, setPage] = useState("sales");

  const handleLogout = () => {
    logout();
  };

  return (
    <CashSessionProvider app={app} appId={appId} userId={user?.uid}>
      <div className="min-h-screen bg-background-default font-sans">
        {/* Header compacto para móvil */}
        <header className="bg-gradient-to-r from-primary to-primary-light shadow-lg sticky top-0 z-40 text-white safe-area-top">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-2 sm:py-3">
              <div className="flex items-center gap-2 sm:gap-4">
                <img
                  src="/paleluapp.png"
                  alt="Palelu Spa Logo"
                  className="h-10 w-10 sm:h-14 sm:w-14 rounded-full border-2 border-white/50"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold tracking-tight">Palelu</h1>
                  <p className="text-[10px] sm:text-xs text-white/70">Spa para mascotas</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="text-xs text-white/90 text-right hidden md:block">
                  <p>{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition-all touch-target"
                  title="Cerrar sesión"
                >
                  <LogOutIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - con padding para bottom nav en móvil */}
        <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 sm:pb-8">
          {/* Navigation - solo visible en desktop */}
          <div className="hidden sm:block bg-white rounded-lg shadow-md p-4 mb-8">
            <nav className="flex space-x-2">
              <DesktopNavButton
                active={page === "sales"}
                onClick={() => setPage("sales")}
                icon={ShoppingCartIcon}
              >
                Punto de Venta
              </DesktopNavButton>
              <DesktopNavButton
                active={page === "inventory"}
                onClick={() => setPage("inventory")}
                icon={PackageIcon}
              >
                Inventario
              </DesktopNavButton>
              <DesktopNavButton
                active={page === "cash"}
                onClick={() => setPage("cash")}
                icon={CashRegisterIcon}
              >
                Caja
              </DesktopNavButton>
            </nav>
          </div>

          {/* Page Content */}
          <div className="animate-fade-in-up">
            {page === "sales" && <SalesPage app={app} appId={appId} />}
            {page === "inventory" && <InventoryPage app={app} appId={appId} />}
            {page === "cash" && <CashRegisterPage app={app} appId={appId} />}
          </div>
        </main>

        {/* Bottom Navigation - solo móvil */}
        <nav className="sm:hidden bottom-nav bg-white border-t border-gray-200 shadow-lg">
          <div className="flex items-stretch">
            <BottomNavButton
              active={page === "sales"}
              onClick={() => setPage("sales")}
              icon={ShoppingCartIcon}
              label="Venta"
            />
            <BottomNavButton
              active={page === "inventory"}
              onClick={() => setPage("inventory")}
              icon={PackageIcon}
              label="Inventario"
            />
            <BottomNavButton
              active={page === "cash"}
              onClick={() => setPage("cash")}
              icon={CashRegisterIcon}
              label="Caja"
            />
          </div>
        </nav>
      </div>
    </CashSessionProvider>
  );
};

// Botón de navegación desktop
const DesktopNavButton = ({ active, onClick, children, icon: Icon, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-3 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
      active
        ? "bg-secondary/10 text-secondary"
        : disabled
        ? "text-gray-300 cursor-not-allowed"
        : "text-text-secondary hover:bg-gray-100"
    }`}
  >
    <Icon className="w-5 h-5" />
    <span>{children}</span>
  </button>
);

// App con loading de auth
const AuthenticatedApp = () => {
  const { user, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-default">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-primary">Conectando a Palelu Spa...</p>
        </div>
      </div>
    );
  }

  return user ? <AppContent /> : <LoginPage />;
};

// --- Componente Principal de la App ---
export default function App() {
  return (
    <ToastProvider>
      <AuthProvider app={app}>
        <AuthenticatedApp />
      </AuthProvider>
    </ToastProvider>
  );
}
