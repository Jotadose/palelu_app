import React, { useState, useEffect, useMemo } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { Modal, StatCard, Button, Card, CardHeader, CardContent } from "../components/UI";
import {
  CashRegisterIcon,
  DollarSignIcon,
  BanknoteIcon,
  CreditCardIcon,
  SmartphoneIcon,
  LockIcon,
  UnlockIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  TrendingUpIcon,
  ReceiptIcon,
} from "../components/Icons";

// Modal de Apertura de Caja - Optimizado para móvil
const OpenCashModal = ({ isOpen, onClose, onOpen }) => {
  const [initialCash, setInitialCash] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!initialCash || parseFloat(initialCash) < 0) return;
    setIsLoading(true);
    try {
      await onOpen(parseFloat(initialCash));
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Abrir Caja del Día" fullScreenMobile>
      <form onSubmit={handleSubmit} className="space-y-6 p-2 sm:p-4">
        <div className="text-center">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <UnlockIcon className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-600">
            Ingresa el monto inicial en efectivo para comenzar las operaciones del día.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            💵 Fondo Inicial (Efectivo)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">$</span>
            <input
              type="number"
              value={initialCash}
              onChange={(e) => setInitialCash(e.target.value)}
              min="0"
              step="100"
              inputMode="numeric"
              className="w-full pl-10 pr-4 py-4 text-2xl font-bold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 touch-target"
              placeholder="0"
              autoFocus
              required
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 pb-safe">
          <Button variant="outline" onClick={onClose} className="flex-1 py-4 touch-target">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="success"
            disabled={isLoading || !initialCash}
            className="flex-1 py-4 touch-target"
          >
            {isLoading ? "Abriendo..." : "Abrir Caja"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Modal de Cierre de Caja - Optimizado para móvil
const CloseCashModal = ({ isOpen, onClose, onCloseSession, expectedCash, totals }) => {
  const [actualCash, setActualCash] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const difference = actualCash ? parseFloat(actualCash) - expectedCash : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!actualCash) return;
    setIsLoading(true);
    try {
      await onCloseSession(parseFloat(actualCash), notes);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cerrar Caja" size="lg" fullScreenMobile>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 p-2 sm:p-4">
        {/* Resumen */}
        <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-3">
          <h4 className="font-bold text-gray-800">Resumen del Día</h4>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">💵 Efectivo:</span>
              <span className="font-bold">${totals.efectivo?.toLocaleString("es-CL")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">📱 Transfer:</span>
              <span className="font-bold">${totals.transferencia?.toLocaleString("es-CL")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">💳 Tarjeta:</span>
              <span className="font-bold">${totals.tarjeta?.toLocaleString("es-CL")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">📤 Gastos:</span>
              <span className="font-bold text-red-600">
                -${totals.totalExpenses?.toLocaleString("es-CL")}
              </span>
            </div>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <span className="font-bold text-gray-800">Total Ventas:</span>
            <span className="font-bold text-green-600 text-lg">
              ${totals.totalSales?.toLocaleString("es-CL")}
            </span>
          </div>
        </div>

        {/* Efectivo esperado */}
        <div className="bg-blue-50 rounded-xl p-3 sm:p-4">
          <div className="flex justify-between items-center">
            <span className="text-blue-800 font-medium text-sm sm:text-base">Efectivo Esperado:</span>
            <span className="font-bold text-blue-800 text-lg sm:text-xl">
              ${expectedCash.toLocaleString("es-CL")}
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            (Fondo inicial + Efectivo - Gastos)
          </p>
        </div>

        {/* Input de efectivo real */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            💰 Efectivo Real en Caja
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">$</span>
            <input
              type="number"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              min="0"
              step="100"
              inputMode="numeric"
              className="w-full pl-10 pr-4 py-4 text-2xl font-bold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary touch-target"
              placeholder="0"
              autoFocus
              required
            />
          </div>
        </div>

        {/* Diferencia */}
        {actualCash && (
          <div
            className={`rounded-xl p-4 ${
              difference === 0
                ? "bg-green-50"
                : difference > 0
                ? "bg-blue-50"
                : "bg-red-50"
            }`}
          >
            <div className="flex justify-between items-center">
              <span
                className={`font-medium text-sm sm:text-base ${
                  difference === 0
                    ? "text-green-800"
                    : difference > 0
                    ? "text-blue-800"
                    : "text-red-800"
                }`}
              >
                {difference === 0
                  ? "✅ Caja cuadra"
                  : difference > 0
                  ? "📈 Sobrante"
                  : "📉 Faltante"}
              </span>
              <span
                className={`font-bold text-xl ${
                  difference === 0
                    ? "text-green-600"
                    : difference > 0
                    ? "text-blue-600"
                    : "text-red-600"
                }`}
              >
                {difference >= 0 ? "+" : ""}${difference.toLocaleString("es-CL")}
              </span>
            </div>
          </div>
        )}

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📝 Notas (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary touch-target"
            placeholder="Observaciones del cierre..."
          />
        </div>

        <div className="flex gap-3 pt-2 pb-safe">
          <Button variant="outline" onClick={onClose} className="flex-1 py-4 touch-target">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="danger"
            icon={LockIcon}
            disabled={isLoading || !actualCash}
            className="flex-1 py-4 touch-target"
          >
            {isLoading ? "Cerrando..." : "Cerrar Caja"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Modal de Registrar Gasto - Optimizado para móvil
const ExpenseModal = ({ isOpen, onClose, onAddExpense }) => {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Insumos");
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    "Insumos",
    "Hielo",
    "Pan/Ingredientes",
    "Transporte",
    "Propinas",
    "Otros",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !description) return;
    setIsLoading(true);
    try {
      await onAddExpense(parseFloat(amount), description, category);
      setAmount("");
      setDescription("");
      setCategory("Insumos");
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Gasto/Egreso">
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            💸 Monto
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="100"
              inputMode="numeric"
              className="w-full pl-10 pr-4 py-4 text-xl font-bold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 touch-target"
              placeholder="0"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📋 Categoría
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 touch-target"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📝 Descripción
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 touch-target"
            placeholder="Ej: Compra de hielo, pan..."
            required
            autoComplete="off"
          />
        </div>

        <div className="flex gap-3 pt-2 pb-safe">
          <Button variant="outline" onClick={onClose} className="flex-1 py-4 touch-target">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="danger"
            icon={MinusCircleIcon}
            disabled={isLoading || !amount || !description}
            className="flex-1 py-4 touch-target"
          >
            {isLoading ? "Guardando..." : "Registrar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Página principal de Caja
export const CashRegisterPage = ({ app, appId }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const db = getFirestore(app);

  const [currentSession, setCurrentSession] = useState(null);
  const [todayOrders, setTodayOrders] = useState([]);
  const [cashMovements, setCashMovements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const sessionsPath = `artifacts/${appId}/public/data/cash_sessions`;
  const ordersPath = `artifacts/${appId}/public/data/orders`;
  const movementsPath = `artifacts/${appId}/public/data/cash_movements`;

  // Cargar sesión activa
  useEffect(() => {
    const q = query(
      collection(db, sessionsPath),
      where("status", "==", "open"),
      orderBy("openedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const sessionDoc = snapshot.docs[0];
        setCurrentSession({ id: sessionDoc.id, ...sessionDoc.data() });
      } else {
        setCurrentSession(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db, sessionsPath]);

  // Cargar órdenes de la sesión actual
  useEffect(() => {
    if (!currentSession) {
      setTodayOrders([]);
      return;
    }

    const q = query(
      collection(db, ordersPath),
      where("sessionId", "==", currentSession.id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTodayOrders(orders);
    });

    return () => unsubscribe();
  }, [db, ordersPath, currentSession]);

  // Cargar movimientos de caja
  useEffect(() => {
    if (!currentSession) {
      setCashMovements([]);
      return;
    }

    const q = query(
      collection(db, movementsPath),
      where("sessionId", "==", currentSession.id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const movements = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCashMovements(movements);
    });

    return () => unsubscribe();
  }, [db, movementsPath, currentSession]);

  // Calcular totales
  const totals = useMemo(() => {
    const salesByPayment = todayOrders.reduce(
      (acc, order) => {
        const method = order.paymentMethod || "efectivo";
        acc[method] = (acc[method] || 0) + (order.total || 0);
        acc.totalSales += order.total || 0;
        return acc;
      },
      { efectivo: 0, transferencia: 0, tarjeta: 0, totalSales: 0 }
    );

    const totalExpenses = cashMovements
      .filter((m) => m.type === "expense")
      .reduce((sum, m) => sum + m.amount, 0);

    const expectedCash = currentSession
      ? currentSession.initialCash + salesByPayment.efectivo - totalExpenses
      : 0;

    return {
      ...salesByPayment,
      totalExpenses,
      expectedCash,
    };
  }, [todayOrders, cashMovements, currentSession]);

  // Abrir caja
  const handleOpenCash = async (initialCash) => {
    try {
      await addDoc(collection(db, sessionsPath), {
        openedAt: Timestamp.now(),
        openedBy: user?.email || "unknown",
        openedByUid: user?.uid,
        initialCash,
        status: "open",
      });
      showToast("¡Caja abierta exitosamente!");
    } catch (error) {
      console.error("Error abriendo caja:", error);
      showToast("Error al abrir la caja", "error");
      throw error;
    }
  };

  // Cerrar caja
  const handleCloseCash = async (actualCash, notes) => {
    if (!currentSession) return;

    try {
      const difference = actualCash - totals.expectedCash;

      await updateDoc(doc(db, sessionsPath, currentSession.id), {
        status: "closed",
        closedAt: Timestamp.now(),
        closedBy: user?.email || "unknown",
        closedByUid: user?.uid,
        actualCash,
        expectedCash: totals.expectedCash,
        difference,
        notes,
        finalTotals: totals,
      });
      showToast("¡Caja cerrada exitosamente!");
    } catch (error) {
      console.error("Error cerrando caja:", error);
      showToast("Error al cerrar la caja", "error");
      throw error;
    }
  };

  // Registrar gasto
  const handleAddExpense = async (amount, description, category) => {
    if (!currentSession) return;

    try {
      await addDoc(collection(db, movementsPath), {
        sessionId: currentSession.id,
        type: "expense",
        amount,
        description,
        category,
        addedBy: user?.email || "unknown",
        addedByUid: user?.uid,
        createdAt: Timestamp.now(),
      });
      showToast("Gasto registrado");
    } catch (error) {
      console.error("Error registrando gasto:", error);
      showToast("Error al registrar el gasto", "error");
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando estado de caja...</p>
      </div>
    );
  }

  // Vista cuando NO hay caja abierta
  if (!currentSession) {
    return (
      <div className="space-y-6">
        <OpenCashModal
          isOpen={isOpenModalOpen}
          onClose={() => setIsOpenModalOpen(false)}
          onOpen={handleOpenCash}
        />

        <div className="text-center py-16">
          <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <LockIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Caja Cerrada
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Para comenzar a registrar ventas y movimientos, primero debes abrir la caja del día.
          </p>
          <Button
            variant="success"
            size="lg"
            icon={UnlockIcon}
            onClick={() => setIsOpenModalOpen(true)}
          >
            Abrir Caja
          </Button>
        </div>
      </div>
    );
  }

  // Vista con caja abierta
  return (
    <div className="space-y-6">
      {/* Modales */}
      <CloseModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onCloseSession={handleCloseCash}
        expectedCash={totals.expectedCash}
        totals={totals}
      />
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onAddExpense={handleAddExpense}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full">
              <UnlockIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Caja Abierta</h1>
              <p className="text-sm text-gray-500">
                Desde{" "}
                {currentSession.openedAt?.toDate?.().toLocaleTimeString("es-CL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                por {currentSession.openedBy}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="danger"
            icon={MinusCircleIcon}
            onClick={() => setIsExpenseModalOpen(true)}
          >
            Registrar Gasto
          </Button>
          <Button
            variant="outline"
            icon={LockIcon}
            onClick={() => setIsCloseModalOpen(true)}
          >
            Cerrar Caja
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Fondo Inicial"
          value={`$${currentSession.initialCash?.toLocaleString("es-CL")}`}
          icon={BanknoteIcon}
          color="blue"
        />
        <StatCard
          title="Ventas Totales"
          value={`$${totals.totalSales.toLocaleString("es-CL")}`}
          icon={TrendingUpIcon}
          color="green"
        />
        <StatCard
          title="Gastos"
          value={`$${totals.totalExpenses.toLocaleString("es-CL")}`}
          icon={MinusCircleIcon}
          color="orange"
        />
        <StatCard
          title="Efectivo Esperado"
          value={`$${totals.expectedCash.toLocaleString("es-CL")}`}
          icon={DollarSignIcon}
          color="purple"
        />
      </div>

      {/* Detalle por método de pago */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <BanknoteIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Efectivo</p>
              <p className="text-2xl font-bold text-green-600">
                ${totals.efectivo.toLocaleString("es-CL")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <SmartphoneIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Transferencia</p>
              <p className="text-2xl font-bold text-blue-600">
                ${totals.transferencia.toLocaleString("es-CL")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <CreditCardIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tarjeta</p>
              <p className="text-2xl font-bold text-purple-600">
                ${totals.tarjeta.toLocaleString("es-CL")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gastos del día */}
      {cashMovements.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-bold text-gray-800">Gastos/Egresos del Día</h3>
          </CardHeader>
          <div className="divide-y">
            {cashMovements.map((movement) => (
              <div
                key={movement.id}
                className="px-6 py-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {movement.description}
                  </p>
                  <p className="text-sm text-gray-500">
                    {movement.category} •{" "}
                    {movement.createdAt?.toDate?.().toLocaleTimeString("es-CL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="font-bold text-red-600">
                  -${movement.amount.toLocaleString("es-CL")}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Últimas ventas */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-gray-800">
            Últimas Ventas ({todayOrders.length})
          </h3>
        </CardHeader>
        {todayOrders.length === 0 ? (
          <CardContent>
            <p className="text-center text-gray-500 py-8">
              No hay ventas registradas en esta sesión
            </p>
          </CardContent>
        ) : (
          <div className="divide-y max-h-64 overflow-y-auto">
            {todayOrders.slice(0, 10).map((order) => (
              <div
                key={order.id}
                className="px-6 py-3 flex justify-between items-center hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    #{order.orderNumber || order.id?.slice(-6)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.items?.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-green-600">
                    ${order.total?.toLocaleString("es-CL")}
                  </span>
                  <p className="text-xs text-gray-500">
                    {order.paymentMethod === "efectivo" && "💵"}
                    {order.paymentMethod === "transferencia" && "📱"}
                    {order.paymentMethod === "tarjeta" && "💳"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// Alias para el modal de cierre
const CloseModal = CloseCashModal;
