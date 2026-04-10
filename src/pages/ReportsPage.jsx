import React, { useState, useEffect, useMemo } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { useEvent } from "../contexts/EventContext";
import { StatCard, Button } from "../components/UI";
import {
  DollarSignIcon,
  ShoppingCartIcon,
  StarIcon,
  PackageIcon,
  BanknoteIcon,
  CreditCardIcon,
  SmartphoneIcon,
  TrendingUpIcon,
} from "../components/Icons";

export const ReportsPage = ({ app, appId }) => {
  const { currentEvent, events } = useEvent();
  const db = getFirestore(app);

  const [selectedEventId, setSelectedEventId] = useState("");
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Default al evento activo si existe
  useEffect(() => {
    if (currentEvent) {
      setSelectedEventId(currentEvent.id);
    } else if (events.length > 0) {
      setSelectedEventId(events[0].id);
    }
  }, [currentEvent, events]);

  // Cargar órdenes del evento seleccionado
  useEffect(() => {
    if (!selectedEventId) {
      setOrders([]);
      return;
    }

    setIsLoading(true);
    const ordersPath = `artifacts/${appId}/public/data/orders`;
    const q = query(
      collection(db, ordersPath),
      where("eventId", "==", selectedEventId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Ordenar por fecha
        ordersData.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        });
        setOrders(ordersData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error cargando órdenes:", error);
        setOrders([]);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, appId, selectedEventId]);

  // Calcular métricas
  const metrics = useMemo(() => {
    const totalVentas = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrdenes = orders.length;

    // Por método de pago
    const porPago = orders.reduce(
      (acc, order) => {
        const method = order.paymentMethod || "efectivo";
        acc[method] = (acc[method] || 0) + (order.total || 0);
        return acc;
      },
      { efectivo: 0, transferencia: 0, tarjeta: 0 }
    );

    // Productos más vendidos
    const productCounts = {};
    orders.forEach((order) => {
      order.items?.forEach((item) => {
        productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
      });
    });

    const topProducts = Object.entries(productCounts)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Ticket promedio
    const ticketPromedio = totalOrdenes > 0 ? totalVentas / totalOrdenes : 0;

    return {
      totalVentas,
      totalOrdenes,
      porPago,
      topProducts,
      ticketPromedio,
    };
  }, [orders]);

  // Formatear fecha
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="space-y-4 sm:space-y-6 pb-safe">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">📊 Reportes</h1>
          <p className="text-text-secondary text-sm sm:text-base">
            Análisis de ventas por evento
          </p>
        </div>
      </div>

      {/* Selector de evento */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Evento
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 touch-target"
        >
          <option value="">Selecciona un evento</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.status === "open" ? "🔴 " : "🔒 "}
              {event.name} ({event.date})
            </option>
          ))}
        </select>
      </div>

      {/* Si no hay evento seleccionado */}
      {!selectedEventId && (
        <div className="text-center py-16 px-4 bg-white rounded-xl shadow-md">
          <PackageIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-700">
            Selecciona un evento
          </h3>
          <p className="mt-1 text-gray-500">
            Elige un evento para ver sus reportes
          </p>
        </div>
      )}

      {/* Reportes del evento */}
      {selectedEventId && (
        <>
          {/* Info del evento */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl p-4 text-white">
            <h3 className="font-bold text-lg">{selectedEvent?.name}</h3>
            <p className="text-sm opacity-90">
              📅 {selectedEvent?.date} | {selectedEvent?.status === "open" ? "🔴 Activo" : "🔒 Cerrado"}
            </p>
          </div>

          {/* Stats principales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Ventas Totales"
              value={`$${metrics.totalVentas.toLocaleString("es-CL")}`}
              icon={DollarSignIcon}
              color="green"
            />
            <StatCard
              title="# Órdenes"
              value={metrics.totalOrdenes}
              icon={ShoppingCartIcon}
              color="blue"
            />
            <StatCard
              title="Ticket Promedio"
              value={`$${Math.round(metrics.ticketPromedio).toLocaleString("es-CL")}`}
              icon={TrendingUpIcon}
              color="orange"
            />
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-sm font-medium text-gray-500 mb-2">Top Producto</p>
              <p className="text-lg font-bold text-primary truncate">
                {metrics.topProducts[0]?.name || "N/A"}
              </p>
              {metrics.topProducts[0] && (
                <p className="text-xs text-gray-500">
                  {metrics.topProducts[0].quantity} unidades
                </p>
              )}
            </div>
          </div>

          {/* Ventas por método de pago */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b">
              <h2 className="font-bold text-gray-800">Ventas por Método de Pago</h2>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <BanknoteIcon className="w-6 h-6 text-green-600" />
                    <span className="font-medium text-green-800">Efectivo</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    ${metrics.porPago.efectivo.toLocaleString("es-CL")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {metrics.totalVentas > 0 
                      ? Math.round((metrics.porPago.efectivo / metrics.totalVentas) * 100)
                      : 0}% del total
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <SmartphoneIcon className="w-6 h-6 text-blue-600" />
                    <span className="font-medium text-blue-800">Transferencia</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    ${metrics.porPago.transferencia.toLocaleString("es-CL")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {metrics.totalVentas > 0 
                      ? Math.round((metrics.porPago.transferencia / metrics.totalVentas) * 100)
                      : 0}% del total
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CreditCardIcon className="w-6 h-6 text-purple-600" />
                    <span className="font-medium text-purple-800">Tarjeta</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    ${metrics.porPago.tarjeta.toLocaleString("es-CL")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {metrics.totalVentas > 0 
                      ? Math.round((metrics.porPago.tarjeta / metrics.totalVentas) * 100)
                      : 0}% del total
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Productos más vendidos */}
          {metrics.topProducts.length > 0 && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b">
                <h2 className="font-bold text-gray-800">Productos Más Vendidos</h2>
              </div>
              <div className="divide-y">
                {metrics.topProducts.map((product, index) => (
                  <div key={product.name} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 
                          ? "bg-yellow-100 text-yellow-700" 
                          : index === 1 
                          ? "bg-gray-100 text-gray-700"
                          : "bg-orange-100 text-orange-700"
                      }`}>
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-800">{product.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-primary">{product.quantity}</span>
                      <span className="text-xs text-gray-500 ml-1">unid.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historial de órdenes */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b flex justify-between items-center">
              <h2 className="font-bold text-gray-800">
                Historial de Órdenes ({orders.length})
              </h2>
            </div>
            
            {isLoading ? (
              <div className="p-6 text-center text-text-secondary">
                <svg className="animate-spin h-8 w-8 mx-auto mb-2 text-primary" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Cargando...
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">
                <ShoppingCartIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-medium">No hay ventas</h3>
                <p className="mt-1">Este evento no tiene ventas registradas</p>
              </div>
            ) : (
              <div className="divide-y max-h-[400px] overflow-y-auto">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-mono font-bold text-primary text-sm">
                          #{order.orderNumber || order.id?.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <span className="font-bold text-green-600">
                        ${order.total?.toLocaleString("es-CL")}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {order.items?.map((item, idx) => (
                        <span key={idx}>
                          {idx > 0 && ", "}
                          {item.quantity}x {item.name}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100">
                        {order.paymentMethod === "efectivo" && "💵 Efectivo"}
                        {order.paymentMethod === "transferencia" && "📱 Transferencia"}
                        {order.paymentMethod === "tarjeta" && "💳 Tarjeta"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};