import React, { useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, setLogLevel } from "firebase/firestore";

import { firebaseConfig } from "./firebaseConfig";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { CashSessionProvider } from "./contexts/CashSessionContext";
import { EventProvider, useEvent } from "./contexts/EventContext";

import { LoginPage } from "./pages/LoginPage";
import { SalesPage } from "./pages/SalesPage";
import { InventoryPage } from "./pages/InventoryPage";
import { CashRegisterPage } from "./pages/CashRegisterPage";
import { EventsPage } from "./pages/EventsPage";
import { ReportsPage } from "./pages/ReportsPage";

import {
  ShoppingCartIcon,
  PackageIcon,
  LogOutIcon,
  CashRegisterIcon,
  CalendarIcon,
  ChartIcon,
} from "./components/Icons";

let app, db, appId;
try {
  appId = firebaseConfig.appId;
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  setLogLevel("error");
} catch (error) {
  console.error("Error al inicializar Firebase.", error);
}

const BottomNavButton = ({ active, onClick, icon: Icon, label, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition-all touch-target ${
      active ? "text-secondary" : disabled ? "text-gray-300 cursor-not-allowed" : "text-gray-500"
    }`}
  >
    <div className={`p-1.5 rounded-xl transition-all ${active ? "bg-secondary/10" : ""}`}>
      <Icon className={`w-6 h-6 ${active ? "scale-110" : ""}`} />
    </div>
    <span className={`text-[10px] mt-0.5 font-medium ${active ? "text-secondary" : ""}`}>{label}</span>
  </button>
);

const DesktopNavButton = ({ active, onClick, children, icon: Icon, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-3 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
      active ? "bg-secondary/10 text-secondary" : disabled ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    <Icon className="w-5 h-5" />
    <span>{children}</span>
  </button>
);

// Wrapper que contiene los providers
const AppWithProviders = ({ user, onLogout }) => {
  const [page, setPage] = useState("sales");

  return (
    <EventProvider app={app} appId={appId} userId={user?.uid}>
      <AppContent user={user} onLogout={onLogout} page={page} setPage={setPage} />
    </EventProvider>
  );
};

// Componente interno que SÍ puede usar useEvent (está dentro del provider)
const AppContent = ({ user, onLogout, page, setPage }) => {
  const { currentEvent } = useEvent();

  return (
    <CashSessionProvider app={app} appId={appId} userId={user?.uid}>
      <div className="min-h-screen bg-gray-50 font-sans">
        <header className="bg-gradient-to-r from-pink-500 to-pink-400 shadow-lg sticky top-0 z-40 text-white">
          <div className="max-w-7xl mx-auto px-3 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-pink-500 text-xl">🍔</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Palelu</h1>
                <p className="text-xs text-white/70">Punto de Venta</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentEvent && (
                <div className="hidden md:flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full text-xs">
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                  <span className="font-medium">{currentEvent.name}</span>
                </div>
              )}
              <button onClick={onLogout} className="p-2 rounded-full bg-white/20 hover:bg-white/30">
                <LogOutIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-3 py-4 pb-24">
          <div className="hidden sm:block bg-white rounded-lg shadow p-4 mb-6">
            <nav className="flex space-x-2">
              <DesktopNavButton active={page === "sales"} onClick={() => setPage("sales")} icon={ShoppingCartIcon}>Venta</DesktopNavButton>
              <DesktopNavButton active={page === "inventory"} onClick={() => setPage("inventory")} icon={PackageIcon}>Inventario</DesktopNavButton>
              <DesktopNavButton active={page === "events"} onClick={() => setPage("events")} icon={CalendarIcon}>Eventos</DesktopNavButton>
              <DesktopNavButton active={page === "reports"} onClick={() => setPage("reports")} icon={ChartIcon}>Reportes</DesktopNavButton>
              <DesktopNavButton active={page === "cash"} onClick={() => setPage("cash")} icon={CashRegisterIcon}>Caja</DesktopNavButton>
            </nav>
          </div>

          <div>
            {page === "sales" && <SalesPage app={app} appId={appId} />}
            {page === "inventory" && <InventoryPage app={app} appId={appId} />}
            {page === "events" && <EventsPage app={app} appId={appId} />}
            {page === "reports" && <ReportsPage app={app} appId={appId} />}
            {page === "cash" && <CashRegisterPage app={app} appId={appId} />}
          </div>
        </main>

        <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="flex">
            <BottomNavButton active={page === "sales"} onClick={() => setPage("sales")} icon={ShoppingCartIcon} label="Venta" />
            <BottomNavButton active={page === "inventory"} onClick={() => setPage("inventory")} icon={PackageIcon} label="Inventario" />
            <BottomNavButton active={page === "events"} onClick={() => setPage("events")} icon={CalendarIcon} label="Eventos" />
            <BottomNavButton active={page === "cash"} onClick={() => setPage("cash")} icon={CashRegisterIcon} label="Caja" />
          </div>
        </nav>
      </div>
    </CashSessionProvider>
  );
};

const AuthenticatedApp = () => {
  const { user, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-pink-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return <AppWithProviders user={user} onLogout={() => useAuth().logout()} />;
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider app={app}>
        <AuthenticatedApp />
      </AuthProvider>
    </ToastProvider>
  );
}