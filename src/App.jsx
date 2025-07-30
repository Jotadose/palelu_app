import React, { useState, useEffect, useMemo } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  writeBatch,
  query,
} from "firebase/firestore";
import { setLogLevel } from "firebase/firestore";

// --- Configuración de Firebase ---
import { firebaseConfig } from "./firebaseConfig";

// --- Íconos Temáticos ---
const PizzaIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 11h.01" />
    <path d="M11 15h.01" />
    <path d="M16 16h.01" />
    <path d="m2 16 2.24 1.12a2 2 0 0 0 1.52-.22L8 15.5l.9 2.4c.27.73 1.1.98 1.8.7l5.4-2.02c.56-.21.9-.76.9-1.38V4.4c0-.55-.34-1.05-.85-1.25L12 2 4.15 3.15c-.5.2-.85.7-.85 1.25v10.2c0 .4.2.78.53.98Z" />
  </svg>
);
const ShoppingCartIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.16" />
  </svg>
);
const PlusCircleIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);
const Trash2Icon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);
const EditIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);
const XIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const PackageIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v2" />
    <path d="M21 14v2a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16v-2" />
    <path d="M3 10v4" />
    <path d="M21 10v4" />
    <path d="M12 22V12" />
    <path d="m7 12-5-2.5" />
    <path d="m17 12 5-2.5" />
  </svg>
);
const LogOutIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const DollarSignIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const StarIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// --- Inicialización de Firebase ---
let app, auth, db, appId;
try {
  appId = firebaseConfig.appId;
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  setLogLevel("error");
} catch (error) {
  console.error("Error al inicializar Firebase.", error);
}

// --- Componentes de la UI (sin cambios) ---
const Modal = ({ isOpen, onClose, title, children }) => {
  /* ... */
};
const ProductForm = ({ onClose, userId, productToEdit }) => {
  /* ... */
};
const InventoryPage = ({ user }) => {
  /* ... */
};
const SalesForm = ({ userId, products, onClose }) => {
  /* ... */
};
const LoginPage = () => {
  /* ... */
};

// --- NUEVO COMPONENTE DE UI ---
const StatCard = ({ title, value, icon: Icon }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
    <div className="bg-pink-100 p-3 rounded-full mr-4">
      <Icon className="w-6 h-6 text-pink-600" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

// --- PÁGINA DE VENTAS (MODIFICADA) ---
const SalesPage = ({ user }) => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  useEffect(() => {
    if (!user || !db) return;
    const salesQuery = query(
      collection(db, `artifacts/${appId}/public/data/sales`)
    );
    const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
      const salesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      salesData.sort((a, b) => b.saleDate.toDate() - a.saleDate.toDate());
      setSales(salesData);
      setIsLoading(false);
    });
    const productsQuery = query(
      collection(db, `artifacts/${appId}/public/data/products`)
    );
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubscribeSales();
      unsubscribeProducts();
    };
  }, [user]);

  // Lógica para calcular las métricas del dashboard
  const dashboardStats = useMemo(() => {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalItemsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);

    const productSales = sales.reduce((acc, sale) => {
      acc[sale.productName] = (acc[sale.productName] || 0) + sale.quantity;
      return acc;
    }, {});

    let bestSellingProduct = "N/A";
    let maxQuantity = 0;
    for (const [productName, quantity] of Object.entries(productSales)) {
      if (quantity > maxQuantity) {
        maxQuantity = quantity;
        bestSellingProduct = productName;
      }
    }

    return {
      totalRevenue,
      totalItemsSold,
      bestSellingProduct,
    };
  }, [sales]);

  return (
    <div className="space-y-8">
      <Modal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        title="Registrar Nueva Venta"
      >
        <SalesForm
          userId={user.uid}
          products={products}
          onClose={() => setIsSaleModalOpen(false)}
        />
      </Modal>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Dashboard de Ventas
        </h1>
        <button
          onClick={() => setIsSaleModalOpen(true)}
          disabled={products.filter((p) => p.stock > 0).length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-full shadow-lg hover:bg-pink-700 disabled:bg-pink-300 disabled:cursor-not-allowed transition-all transform hover:scale-105"
        >
          <PlusCircleIcon className="w-5 h-5" />
          <span>Nueva Venta</span>
        </button>
      </div>

      {/* Dashboard de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Recaudado"
          value={`$${dashboardStats.totalRevenue.toFixed(2)}`}
          icon={DollarSignIcon}
        />
        <StatCard
          title="Productos Vendidos"
          value={dashboardStats.totalItemsSold}
          icon={ShoppingCartIcon}
        />
        <StatCard
          title="Producto Estrella"
          value={dashboardStats.bestSellingProduct}
          icon={StarIcon}
        />
      </div>

      {/* Historial de Ventas */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="px-6 py-4 bg-pink-50 text-pink-800 font-bold text-md">
          Historial de Transacciones
        </h2>
        <div className="overflow-x-auto">
          {isLoading ? (
            <p className="p-6 text-center text-gray-500">Cargando ventas...</p>
          ) : sales.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <h3 className="text-lg font-medium">No hay ventas registradas</h3>
              <p className="mt-1">¡Realiza tu primera venta para verla aquí!</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {sales.map((sale, index) => (
                  <tr
                    key={sale.id}
                    className={`border-t ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    } hover:bg-pink-50/50`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {sale.productName}
                      <span className="ml-2 text-gray-400">
                        x{sale.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell text-gray-500 text-right">
                      {new Date(
                        sale.saleDate.seconds * 1000
                      ).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800 text-right">
                      ${sale.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

const AppContent = ({ user }) => {
  const [page, setPage] = useState("inventory");

  const handleLogout = () => {
    signOut(auth).catch((error) =>
      console.error("Error al cerrar sesión:", error)
    );
  };

  const NavButton = ({ active, onClick, children, icon: Icon }) => (
    <button
      onClick={onClick}
      className={`flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-3 px-4 py-3 sm:px-6 sm:py-3 rounded-lg text-sm font-medium transition-colors ${
        active ? "bg-pink-100 text-pink-700" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="hidden sm:inline">{children}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-pink-50/50 font-sans">
      <header className="bg-gradient-to-r from-pink-600 to-rose-500 shadow-lg sticky top-0 z-10 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-4">
              <img
                src="/paleluapp.png"
                alt="Palelu Spa Logo"
                className="h-12 w-12 rounded-full"
              />
              <h1 className="text-2xl font-bold tracking-tight">Palelu Spa</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-white/80 text-right">
                <p>{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <LogOutIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white sm:rounded-lg shadow-md p-2 sm:p-4 mb-8">
          <nav className="flex space-x-2">
            <NavButton
              active={page === "inventory"}
              onClick={() => setPage("inventory")}
              icon={PackageIcon}
            >
              Inventario
            </NavButton>
            <NavButton
              active={page === "sales"}
              onClick={() => setPage("sales")}
              icon={ShoppingCartIcon}
            >
              Ventas
            </NavButton>
          </nav>
        </div>
        <div>
          {page === "inventory" && <InventoryPage user={user} />}
          {page === "sales" && <SalesPage user={user} />}
        </div>
      </main>
      <footer className="text-center py-6">
        <p className="text-xs text-pink-900/50">Punto de Venta v1.0</p>
      </footer>
    </div>
  );
};

// --- Componente Principal de la App ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (!auth) {
      setIsAuthReady(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-pink-50">
        <p className="text-pink-700">Conectando a Palelu Spa...</p>
      </div>
    );
  }

  return user ? <AppContent user={user} /> : <LoginPage />;
}
