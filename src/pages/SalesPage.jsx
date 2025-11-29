import React, { useState, useEffect, useMemo } from "react";
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { useCashSession } from "../contexts/CashSessionContext";
import { Modal, StatCard, Button } from "../components/UI";
import {
  PlusCircleIcon,
  Trash2Icon,
  ImageIcon,
  DollarSignIcon,
  ShoppingCartIcon,
  StarIcon,
  BanknoteIcon,
  CreditCardIcon,
  SmartphoneIcon,
  CheckCircleIcon,
  PrinterIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
} from "../components/Icons";

// Componente de Ticket/Confirmación de Venta
const SaleConfirmation = ({ order, onClose, onNewSale }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("es-CL", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const paymentMethodLabels = {
    efectivo: "💵 Efectivo",
    transferencia: "📱 Transferencia",
    tarjeta: "💳 Tarjeta",
  };

  return (
    <div className="text-center space-y-6 p-4">
      <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
        <CheckCircleIcon className="w-12 h-12 text-green-600" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800">¡Venta Exitosa!</h2>
        <p className="text-gray-500 mt-1">
          Pedido #{order.orderNumber || order.id?.slice(-6).toUpperCase()}
        </p>
      </div>

      {/* Ticket */}
      <div className="bg-gray-50 rounded-lg p-4 text-left border-2 border-dashed border-gray-300">
        <div className="text-center border-b border-gray-300 pb-3 mb-3">
          <h3 className="font-bold text-lg">Palelu Spa</h3>
          <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
        </div>

        <div className="space-y-2 text-sm">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex justify-between">
              <span>
                {item.quantity}x {item.name}
              </span>
              <span>${(item.price * item.quantity).toLocaleString("es-CL")}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-300 mt-3 pt-3">
          <div className="flex justify-between font-bold text-lg">
            <span>TOTAL</span>
            <span>${order.total?.toLocaleString("es-CL")}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>Método de pago</span>
            <span>{paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</span>
          </div>
        </div>

        {order.notes && (
          <div className="border-t border-gray-300 mt-3 pt-3 text-sm">
            <span className="font-medium">Notas: </span>
            <span className="text-gray-600">{order.notes}</span>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1 py-3 touch-target">
          Cerrar
        </Button>
        <Button
          variant="primary"
          onClick={onNewSale}
          icon={PlusCircleIcon}
          className="flex-1 py-3 touch-target"
        >
          Nueva Venta
        </Button>
      </div>
    </div>
  );
};

// Selector de Medio de Pago - Optimizado para touch
const PaymentMethodSelector = ({ selected, onChange }) => {
  const methods = [
    { id: "efectivo", label: "Efectivo", icon: BanknoteIcon, color: "green" },
    { id: "transferencia", label: "Transfer", icon: SmartphoneIcon, color: "blue" },
    { id: "tarjeta", label: "Tarjeta", icon: CreditCardIcon, color: "purple" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {methods.map(({ id, label, icon: Icon, color }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`p-3 sm:p-3 rounded-xl sm:rounded-lg border-2 transition-all flex flex-col items-center gap-1.5 touch-target active:scale-95 ${
            selected === id
              ? `border-${color}-500 bg-${color}-50 text-${color}-700 shadow-md`
              : "border-gray-200 hover:border-gray-300 text-gray-600 active:bg-gray-100"
          }`}
          style={{
            borderColor: selected === id ? 
              (color === "green" ? "#22c55e" : color === "blue" ? "#3b82f6" : "#a855f7") : 
              undefined,
            backgroundColor: selected === id ? 
              (color === "green" ? "#f0fdf4" : color === "blue" ? "#eff6ff" : "#faf5ff") : 
              undefined,
            minHeight: '64px',
          }}
        >
          <Icon className="w-7 h-7 sm:w-6 sm:h-6" />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
};

// Formulario de Venta
const SalesForm = ({ userId, products, onClose, onSaleComplete, app, appId, sessionId }) => {
  const { showToast } = useToast();
  const db = getFirestore(app);
  const [cart, setCart] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCartExpanded, setIsCartExpanded] = useState(false); // Para móvil

  const addToCart = (product) => {
    setCart((prevCart) => {
      const currentQty = prevCart[product.id]?.quantity || 0;
      if (currentQty >= product.stock) {
        showToast(`No hay más stock de ${product.name}`, "error");
        return prevCart;
      }
      return {
        ...prevCart,
        [product.id]: { ...product, quantity: currentQty + 1 },
      };
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prevCart) => {
      const item = prevCart[productId];
      if (!item) return prevCart;

      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        const newCart = { ...prevCart };
        delete newCart[productId];
        return newCart;
      }
      if (newQty > item.stock) {
        showToast(`Stock máximo: ${item.stock}`, "error");
        return prevCart;
      }
      return {
        ...prevCart,
        [productId]: { ...item, quantity: newQty },
      };
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const newCart = { ...prevCart };
      delete newCart[productId];
      return newCart;
    });
  };

  const total = useMemo(
    () =>
      Object.values(cart).reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    [cart]
  );

  const handleSubmitSale = async () => {
    if (Object.keys(cart).length === 0) return;
    setIsLoading(true);

    try {
      const batch = writeBatch(db);
      const ordersPath = `artifacts/${appId}/public/data/orders`;
      const productsPath = `artifacts/${appId}/public/data/products`;

      // Generar número de orden
      const orderNumber = `P${Date.now().toString().slice(-6)}`;

      // Preparar items de la orden
      const orderItems = Object.values(cart).map((item) => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      }));

      // Crear la orden
      const orderData = {
        orderNumber,
        items: orderItems,
        total,
        paymentMethod,
        notes: notes.trim(),
        sellerId: userId,
        sessionId: sessionId || null,
        status: "completed",
        createdAt: Timestamp.now(),
      };

      const orderRef = doc(collection(db, ordersPath));
      batch.set(orderRef, orderData);

      // Actualizar stock de productos
      for (const item of Object.values(cart)) {
        const productRef = doc(db, productsPath, item.id);
        batch.update(productRef, { stock: item.stock - item.quantity });
      }

      await batch.commit();

      showToast("¡Venta registrada con éxito!");
      onSaleComplete({ id: orderRef.id, ...orderData });
    } catch (error) {
      console.error("Error al registrar la venta:", error);
      showToast("Hubo un error al registrar la venta", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const groupedProducts = useMemo(() => {
    if (filteredProducts.length === 0) return {};
    return filteredProducts.reduce((acc, product) => {
      const category = product.category || "Sin Categoría";
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {});
  }, [filteredProducts]);

  return (
    <div className="flex flex-col lg:flex-row h-[85vh] sm:h-[75vh]">
      {/* Catálogo de productos */}
      <div className="w-full lg:w-3/5 p-2 space-y-3 overflow-y-auto border-b lg:border-b-0 lg:border-r flex-1 min-h-0">
        {/* Búsqueda - Optimizada para touch */}
        <div className="sticky top-0 bg-white pb-2 z-10">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 touch-target"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {Object.keys(groupedProducts).sort().map((category) => (
          <div key={category}>
            <h3 className="font-bold text-primary-dark mb-2 sticky top-14 bg-white/90 backdrop-blur-sm py-2 z-[5] text-sm sm:text-base">
              {category}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {groupedProducts[category].map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                  className="relative p-2 text-center bg-white rounded-xl shadow-sm border-2 border-gray-200 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary active:scale-95 active:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all aspect-square flex flex-col justify-center items-center touch-manipulation"
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-12 h-12 sm:w-14 sm:h-14 object-contain mb-1"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "";
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 mb-1 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
                    </div>
                  )}
                  <span className="font-semibold text-[10px] sm:text-xs text-text-primary leading-tight line-clamp-2">
                    {product.name}
                  </span>
                  <span className="block text-xs sm:text-sm text-secondary font-bold mt-0.5">
                    ${product.price.toLocaleString("es-CL")}
                  </span>
                  <span
                    className={`absolute top-0.5 right-0.5 sm:top-1 sm:right-1 text-[10px] font-bold px-1 py-0.5 rounded-full ${
                      product.stock <= 5
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {product.stock}
                  </span>
                  {cart[product.id] && (
                    <span className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 bg-secondary text-white text-[10px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center animate-bounce-in">
                      {cart[product.id].quantity}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Carrito - Colapsable en móvil, fijo en desktop */}
      <div className={`w-full lg:w-2/5 bg-gray-50 flex flex-col transition-all duration-300 ${
        isCartExpanded ? 'fixed inset-0 z-[60] lg:relative lg:inset-auto pt-safe' : 'lg:min-h-0'
      }`}>
        {/* Header del carrito - tocable para expandir en móvil */}
        <div 
          className="p-3 sm:p-4 bg-gray-50 lg:bg-transparent cursor-pointer lg:cursor-default border-t lg:border-t-0"
          onClick={() => setIsCartExpanded(!isCartExpanded)}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-bold text-text-primary flex items-center gap-2">
              🛒 <span>Pedido</span>
              {Object.keys(cart).length > 0 && (
                <span className="bg-secondary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {Object.values(cart).reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </h3>
            {/* Mostrar total y flecha en móvil cuando está colapsado */}
            <div className="flex items-center gap-2 lg:hidden">
              {Object.keys(cart).length > 0 && !isCartExpanded && (
                <span className="font-bold text-green-600">${total.toLocaleString("es-CL")}</span>
              )}
              <span className={`transition-transform duration-300 ${isCartExpanded ? 'rotate-180' : ''}`}>
                ▲
              </span>
            </div>
          </div>
          
          {/* Resumen compacto cuando está colapsado en móvil */}
          {!isCartExpanded && Object.keys(cart).length > 0 && (
            <div className="lg:hidden mt-2 flex flex-wrap gap-1">
              {Object.values(cart).slice(0, 3).map((item) => (
                <span key={item.id} className="text-xs bg-white px-2 py-1 rounded-full border">
                  {item.quantity}x {item.name.length > 10 ? item.name.slice(0, 10) + '...' : item.name}
                </span>
              ))}
              {Object.keys(cart).length > 3 && (
                <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                  +{Object.keys(cart).length - 3} más
                </span>
              )}
            </div>
          )}
        </div>

        {/* Contenido expandible del carrito */}
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          isCartExpanded ? 'max-h-[100vh] opacity-100' : 'max-h-0 lg:max-h-none opacity-0 lg:opacity-100'
        }`}>
          <div className="flex-1 p-3 sm:p-4 pt-0 flex flex-col min-h-0">
            <div className="flex-grow overflow-y-auto -mr-2 pr-2">
              {Object.keys(cart).length === 0 ? (
                <p className="text-text-secondary text-center mt-6 text-sm">
                  Toca productos para agregarlos
                </p>
              ) : (
                <ul className="space-y-2">
                  {Object.values(cart).map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between items-center bg-white p-2 sm:p-3 rounded-xl shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{item.name}</p>
                        <p className="text-xs text-text-secondary">
                          ${item.price.toLocaleString("es-CL")} c/u
                        </p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="flex items-center bg-gray-100 rounded-xl">
                          <button
                            onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}
                            className="p-2.5 sm:p-2 active:bg-gray-300 rounded-l-xl touch-target"
                          >
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <span className="px-3 sm:px-4 font-bold text-sm min-w-[40px] text-center">{item.quantity}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}
                            className="p-2.5 sm:p-2 active:bg-gray-300 rounded-r-xl touch-target"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="font-bold text-xs sm:text-sm text-primary w-16 sm:w-20 text-right">
                          ${(item.price * item.quantity).toLocaleString("es-CL")}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                          className="p-2.5 sm:p-2 text-red-500 active:bg-red-100 rounded-full touch-target"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Notas del pedido */}
            <div className="mt-2 sm:mt-3">
              <input
                type="text"
                placeholder="Notas (ej: sin mayo, para llevar...)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 touch-target"
                autoComplete="off"
              />
            </div>

            {/* Método de pago */}
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
              <p className="text-sm font-medium text-gray-700 mb-2">Método de pago:</p>
              <PaymentMethodSelector
                selected={paymentMethod}
                onChange={setPaymentMethod}
              />
            </div>

            {/* Total y botón de pago */}
            <div className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4 pb-20 sm:pb-4">
              <div className="flex justify-between items-center font-bold text-xl sm:text-2xl text-text-primary">
                <span>Total:</span>
                <span className="text-green-600">${total.toLocaleString("es-CL")}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleSubmitSale(); }}
                disabled={isLoading || Object.keys(cart).length === 0}
                className="w-full mt-3 sm:mt-4 py-4 sm:py-3 text-white text-lg font-bold bg-green-600 rounded-xl shadow-lg active:bg-green-700 active:scale-[0.98] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 touch-target"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Procesando...
                  </span>
                ) : (
                  <>
                    <CheckCircleIcon className="w-6 h-6" />
                    Cobrar ${total.toLocaleString("es-CL")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Página principal de ventas
export const SalesPage = ({ app, appId }) => {
  const { user } = useAuth();
  const { currentSession, isSessionOpen } = useCashSession();
  const db = getFirestore(app);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    const productsQuery = query(
      collection(db, `artifacts/${appId}/public/data/products`)
    );
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const ordersQuery = query(
      collection(db, `artifacts/${appId}/public/data/orders`)
    );
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      ordersData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setOrders(ordersData);
      setIsLoading(false);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, [db, appId]);

  // Filtrar órdenes de hoy
  const todayOrders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return orders.filter((order) => {
      const orderDate = order.createdAt?.toDate?.() || new Date(0);
      return orderDate >= today;
    });
  }, [orders]);

  const dashboardStats = useMemo(() => {
    const totalRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = todayOrders.length;

    // Top producto
    const productCounts = {};
    todayOrders.forEach((order) => {
      order.items?.forEach((item) => {
        productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
      });
    });

    let bestSellingProduct = "N/A";
    let maxQuantity = 0;
    for (const [name, qty] of Object.entries(productCounts)) {
      if (qty > maxQuantity) {
        maxQuantity = qty;
        bestSellingProduct = name;
      }
    }

    // Por método de pago
    const byPayment = todayOrders.reduce(
      (acc, order) => {
        const method = order.paymentMethod || "efectivo";
        acc[method] = (acc[method] || 0) + (order.total || 0);
        return acc;
      },
      { efectivo: 0, transferencia: 0, tarjeta: 0 }
    );

    return { totalRevenue, totalOrders, bestSellingProduct, byPayment };
  }, [todayOrders]);

  const handleSaleComplete = (order) => {
    setCompletedOrder(order);
  };

  const handleNewSale = () => {
    setCompletedOrder(null);
  };

  const handleCloseSaleModal = () => {
    setIsSaleModalOpen(false);
    setCompletedOrder(null);
  };

  const paymentMethodLabels = {
    efectivo: "💵 Efectivo",
    transferencia: "📱 Transferencia",
    tarjeta: "💳 Tarjeta",
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-safe">
      {/* Modal de Venta - fullscreen en móvil */}
      <Modal
        isOpen={isSaleModalOpen}
        onClose={handleCloseSaleModal}
        title={completedOrder ? "Venta Completada" : "Terminal de Venta"}
        size={completedOrder ? "md" : "full"}
        fullScreenMobile={!completedOrder}
      >
        {completedOrder ? (
          <SaleConfirmation
            order={completedOrder}
            onClose={handleCloseSaleModal}
            onNewSale={handleNewSale}
          />
        ) : (
          <SalesForm
            userId={user?.uid}
            products={products.filter((p) => p.stock > 0)}
            onClose={handleCloseSaleModal}
            onSaleComplete={handleSaleComplete}
            app={app}
            appId={appId}
            sessionId={currentSession?.id}
          />
        )}
      </Modal>

      {/* Header - Compacto en móvil */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Punto de Venta
          </h1>
          <p className="text-text-secondary text-sm sm:text-base hidden sm:block">
            {new Date().toLocaleDateString("es-CL", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-text-secondary text-sm sm:hidden">
            {new Date().toLocaleDateString("es-CL", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
        <button
          onClick={() => setIsSaleModalOpen(true)}
          disabled={products.filter((p) => p.stock > 0).length === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 sm:py-3 text-white text-lg sm:text-base bg-green-600 rounded-2xl sm:rounded-full shadow-lg active:bg-green-700 active:scale-[0.98] transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed touch-target"
        >
          <PlusCircleIcon className="w-6 h-6" />
          <span>Nueva Venta</span>
        </button>
      </div>

      {/* Stats del día - Grid optimizado para móvil */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Ventas Hoy"
          value={`$${dashboardStats.totalRevenue.toLocaleString("es-CL")}`}
          icon={DollarSignIcon}
          color="green"
        />
        <StatCard
          title="# Pedidos"
          value={dashboardStats.totalOrders}
          icon={ShoppingCartIcon}
          color="blue"
        />
        <StatCard
          title="Top Producto"
          value={dashboardStats.bestSellingProduct}
          icon={StarIcon}
          color="orange"
        />
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm font-medium text-gray-500 mb-2">Por Método</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>💵 Efectivo</span>
              <span className="font-bold">
                ${dashboardStats.byPayment.efectivo.toLocaleString("es-CL")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>📱 Transferencia</span>
              <span className="font-bold">
                ${dashboardStats.byPayment.transferencia.toLocaleString("es-CL")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>💳 Tarjeta</span>
              <span className="font-bold">
                ${dashboardStats.byPayment.tarjeta.toLocaleString("es-CL")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de ventas del día */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="font-bold text-lg text-gray-800">
            Ventas de Hoy ({todayOrders.length})
          </h2>
        </div>
        
        {/* Contenido - Cards en móvil, Tabla en desktop */}
        {isLoading ? (
          <div className="p-6 text-center text-text-secondary">
            <svg className="animate-spin h-8 w-8 mx-auto mb-2 text-primary" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Cargando ventas...
          </div>
        ) : todayOrders.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">
            <ShoppingCartIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium">No hay ventas hoy</h3>
            <p className="mt-1">¡Realiza tu primera venta del día!</p>
          </div>
        ) : (
          <>
            {/* Vista móvil - Cards */}
            <div className="sm:hidden divide-y">
              {todayOrders.map((order) => (
                <div key={order.id} className="p-4 active:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary text-sm">
                        #{order.orderNumber || order.id?.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {order.createdAt?.toDate?.().toLocaleTimeString("es-CL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <span className="font-bold text-green-600">
                      ${order.total?.toLocaleString("es-CL")}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {order.items?.map((item, idx) => (
                      <span key={idx}>
                        {idx > 0 && ", "}
                        {item.quantity}x {item.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100">
                      {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
                    </span>
                    {order.notes && (
                      <span className="text-xs text-orange-600">📝 {order.notes}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Vista desktop - Tabla */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 font-medium text-gray-500"># Pedido</th>
                    <th className="px-4 lg:px-6 py-3 font-medium text-gray-500">Productos</th>
                    <th className="px-4 lg:px-6 py-3 font-medium text-gray-500">Método</th>
                    <th className="px-4 lg:px-6 py-3 font-medium text-gray-500">Hora</th>
                    <th className="px-4 lg:px-6 py-3 font-medium text-gray-500 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {todayOrders.map((order, index) => (
                    <tr
                      key={order.id}
                      className={`border-t ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="px-4 lg:px-6 py-3 font-mono font-medium text-primary">
                        {order.orderNumber || order.id?.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 lg:px-6 py-3">
                        <div className="max-w-xs">
                          {order.items?.map((item, idx) => (
                            <span key={idx} className="text-gray-600">
                              {idx > 0 && ", "}
                              {item.quantity}x {item.name}
                            </span>
                          ))}
                          {order.notes && (
                            <p className="text-xs text-orange-600 mt-1">
                              📝 {order.notes}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100">
                          {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-gray-500">
                        {order.createdAt?.toDate?.().toLocaleTimeString("es-CL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 lg:px-6 py-3 font-bold text-right text-green-600">
                        ${order.total?.toLocaleString("es-CL")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
