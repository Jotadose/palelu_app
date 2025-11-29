import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";

const CashSessionContext = createContext();

export const useCashSession = () => {
  const context = useContext(CashSessionContext);
  if (!context) {
    throw new Error("useCashSession debe usarse dentro de CashSessionProvider");
  }
  return context;
};

export const CashSessionProvider = ({ children, app, appId, userId }) => {
  const [currentSession, setCurrentSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [todayOrders, setTodayOrders] = useState([]);
  const [cashMovements, setCashMovements] = useState([]);

  const db = getFirestore(app);
  const sessionsPath = `artifacts/${appId}/public/data/cash_sessions`;
  const ordersPath = `artifacts/${appId}/public/data/orders`;
  const movementsPath = `artifacts/${appId}/public/data/cash_movements`;

  // Escuchar la sesión activa del día
  useEffect(() => {
    if (!userId) return;

    // Query simplificada - solo filtra por status "open"
    // No necesita índice compuesto ya que solo usa un campo
    const q = query(
      collection(db, sessionsPath),
      where("status", "==", "open"),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const sessionDoc = snapshot.docs[0];
          setCurrentSession({ id: sessionDoc.id, ...sessionDoc.data() });
        } else {
          setCurrentSession(null);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Error escuchando sesión de caja:", error);
        setCurrentSession(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, sessionsPath, userId]);

  // Escuchar órdenes de la sesión actual
  useEffect(() => {
    if (!currentSession) {
      setTodayOrders([]);
      return;
    }

    // Query sin orderBy para evitar índice compuesto
    // Ordenamos en el cliente
    const q = query(
      collection(db, ordersPath),
      where("sessionId", "==", currentSession.id)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            // Ordenar por createdAt descendente en el cliente
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
          });
        setTodayOrders(orders);
      },
      (error) => {
        console.error("Error escuchando órdenes:", error);
        setTodayOrders([]);
      }
    );

    return () => unsubscribe();
  }, [db, ordersPath, currentSession]);

  // Escuchar movimientos de caja de la sesión actual
  useEffect(() => {
    if (!currentSession) {
      setCashMovements([]);
      return;
    }

    // Query sin orderBy para evitar índice compuesto
    // Ordenamos en el cliente
    const q = query(
      collection(db, movementsPath),
      where("sessionId", "==", currentSession.id)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const movements = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            // Ordenar por createdAt descendente en el cliente
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
          });
        setCashMovements(movements);
      },
      (error) => {
        console.error("Error escuchando movimientos:", error);
        setCashMovements([]);
      }
    );

    return () => unsubscribe();
  }, [db, movementsPath, currentSession]);

  // Abrir caja
  const openCashSession = async (initialCash, openedBy) => {
    try {
      const sessionData = {
        openedAt: Timestamp.now(),
        openedBy,
        initialCash: parseFloat(initialCash),
        status: "open",
        totals: {
          efectivo: 0,
          transferencia: 0,
          tarjeta: 0,
        },
        totalSales: 0,
        totalExpenses: 0,
      };

      const docRef = await addDoc(collection(db, sessionsPath), sessionData);
      return { id: docRef.id, ...sessionData };
    } catch (error) {
      console.error("Error abriendo caja:", error);
      throw error;
    }
  };

  // Cerrar caja
  const closeCashSession = async (closedBy, actualCash, notes = "") => {
    if (!currentSession) throw new Error("No hay sesión activa");

    try {
      // Calcular totales
      const totals = calculateTotals();
      const expectedCash = currentSession.initialCash + totals.efectivo - totals.totalExpenses;
      const difference = parseFloat(actualCash) - expectedCash;

      await updateDoc(doc(db, sessionsPath, currentSession.id), {
        status: "closed",
        closedAt: Timestamp.now(),
        closedBy,
        actualCash: parseFloat(actualCash),
        expectedCash,
        difference,
        notes,
        finalTotals: totals,
      });

      return { success: true, difference };
    } catch (error) {
      console.error("Error cerrando caja:", error);
      throw error;
    }
  };

  // Registrar gasto/egreso
  const addExpense = async (amount, description, category, addedBy) => {
    if (!currentSession) throw new Error("No hay sesión activa");

    try {
      await addDoc(collection(db, movementsPath), {
        sessionId: currentSession.id,
        type: "expense",
        amount: parseFloat(amount),
        description,
        category,
        addedBy,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error registrando gasto:", error);
      throw error;
    }
  };

  // Calcular totales
  const calculateTotals = () => {
    const salesByPayment = todayOrders.reduce(
      (acc, order) => {
        const method = order.paymentMethod || "efectivo";
        acc[method] = (acc[method] || 0) + order.total;
        acc.totalSales += order.total;
        return acc;
      },
      { efectivo: 0, transferencia: 0, tarjeta: 0, totalSales: 0 }
    );

    const totalExpenses = cashMovements
      .filter((m) => m.type === "expense")
      .reduce((sum, m) => sum + m.amount, 0);

    return {
      ...salesByPayment,
      totalExpenses,
      netCash: currentSession
        ? currentSession.initialCash + salesByPayment.efectivo - totalExpenses
        : 0,
    };
  };

  const value = {
    currentSession,
    isLoading,
    todayOrders,
    cashMovements,
    isSessionOpen: !!currentSession,
    openCashSession,
    closeCashSession,
    addExpense,
    calculateTotals,
  };

  return (
    <CashSessionContext.Provider value={value}>
      {children}
    </CashSessionContext.Provider>
  );
};
