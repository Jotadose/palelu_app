import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  Timestamp,
} from "firebase/firestore";

const EventContext = createContext();

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvent debe usarse dentro de EventProvider");
  }
  return context;
};

export const EventProvider = ({ children, app, appId, userId }) => {
  const [currentEvent, setCurrentEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventInventory, setEventInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const db = getFirestore(app);
  const eventsPath = `artifacts/${appId}/public/data/events`;
  const masterProductsPath = `artifacts/${appId}/public/data/products`;

  // Escuchar eventos activos (status="open")
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, eventsPath),
      where("status", "==", "open"),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const eventDoc = snapshot.docs[0];
          const eventData = { id: eventDoc.id, ...eventDoc.data() };
          setCurrentEvent(eventData);
          
          // Cargar inventario del evento
          loadEventInventory(eventDoc.id);
        } else {
          setCurrentEvent(null);
          setEventInventory([]);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Error escuchando evento activo:", error);
        setCurrentEvent(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, eventsPath, userId]);

  // Escuchar todos los eventos (para lista)
  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, eventsPath));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const eventsData = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
          });
        setEvents(eventsData);
      },
      (error) => {
        console.error("Error escuchando eventos:", error);
      }
    );

    return () => unsubscribe();
  }, [db, eventsPath, userId]);

  // Función para cargar inventario del evento
  const loadEventInventory = async (eventId) => {
    const inventoryPath = `${eventsPath}/${eventId}/eventInventories`;
    const q = query(collection(db, inventoryPath));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEventInventory(inventoryData);
    });

    return () => unsubscribe();
  };

  // Obtener todos los eventos (abiertos y cerrados)
  const getEvents = () => {
    return events;
  };

  // Obtener productos del maestro
  const getMasterProducts = async () => {
    const q = query(collection(db, masterProductsPath));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  };

  // Crear nuevo evento
  const createEvent = async (name, date, importFromMaster = false, selectedProducts = []) => {
    try {
      const eventData = {
        name,
        date,
        status: "open",
        createdAt: Timestamp.now(),
        createdBy: userId,
        importFromMaster,
        totals: {
          ventasTotales: 0,
          efectivo: 0,
          transferencia: 0,
          tarjeta: 0,
        },
        productsSold: 0,
      };

      const docRef = await addDoc(collection(db, eventsPath), eventData);

      // Si se importa del maestro, copiar productos al inventario del evento
      if (importFromMaster && selectedProducts.length > 0) {
        const inventoryPath = `${eventsPath}/${docRef.id}/eventInventories`;
        
        for (const product of selectedProducts) {
          await addDoc(collection(db, inventoryPath), {
            productId: product.id,
            name: product.name,
            price: product.price,
            stock: product.initialStock || 0,
            initialStock: product.initialStock || 0,
            sold: 0,
            category: product.category,
            imageUrl: product.imageUrl,
          });
        }
      }

      return { id: docRef.id, ...eventData };
    } catch (error) {
      console.error("Error creando evento:", error);
      throw error;
    }
  };

  // Cerrar evento
  const closeEvent = async (eventId, decisions = {}) => {
    try {
      // decisions: { [productId]: "discard" | "reintegrate" }
      
      // Obtener inventario del evento
      const inventoryPath = `${eventsPath}/${eventId}/eventInventories`;
      const q = query(collection(db, inventoryPath));
      const snapshot = await getDocs(q);
      
      const inventoryItems = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Procesar cada producto según la decisión
      for (const item of inventoryItems) {
        const productKey = item.productId || item.id; // Usar id del doc si no hay productId
        const decision = decisions[productKey] || decisions[item.productId] || "reintegrate";
        
        if (decision === "reintegrate") {
          if (item.isEventExclusive) {
            // Producto exclusivo del evento → crear en el maestro
            await addDoc(collection(db, masterProductsPath), {
              name: item.name,
              price: item.price,
              category: item.category || "Otros",
              imageUrl: item.imageUrl || "",
              stock: item.stock, // El stock restante se agrega al maestro
              active: true,
              createdAt: Timestamp.now(),
              createdFromEvent: eventId,
            });
          } else if (item.productId) {
            // Producto importado del maestro → reintegrar stock
            const masterRef = doc(db, masterProductsPath, item.productId);
            // Obtener stock actual del maestro y sumar
            const masterSnap = await getDocs(query(collection(db, masterProductsPath), where("__name__", "==", item.productId), limit(1)));
            if (!masterSnap.empty) {
              const currentMasterStock = masterSnap.docs[0].data().stock || 0;
              await updateDoc(masterRef, {
                stock: currentMasterStock + item.stock,
              });
            }
          }
        }
        // Si es "discard", simplemente no se hace nada (el stock se pierde/se registra como merma)
      }

      // Actualizar evento a cerrado
      await updateDoc(doc(db, eventsPath, eventId), {
        status: "closed",
        closedAt: Timestamp.now(),
        closedBy: userId,
        closingDecisions: decisions,
      });

      return { success: true };
    } catch (error) {
      console.error("Error cerrando evento:", error);
      throw error;
    }
  };

  // Obtener productos disponibles para venta (evento o maestro)
  const getAvailableProducts = useMemo(() => {
    if (currentEvent && eventInventory.length > 0) {
      // Usar inventario del evento
      return eventInventory.filter(p => p.stock > 0);
    }
    return null; // Indica que debe usar el maestro
  }, [currentEvent, eventInventory]);

  // Actualizar stock del evento ( después de una venta)
  const updateEventStock = async (productId, quantity) => {
    if (!currentEvent) return;

    const inventoryPath = `${eventsPath}/${currentEvent.id}/eventInventories`;
    const q = query(
      collection(db, inventoryPath),
      where("productId", "==", productId),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      const currentStock = snapshot.docs[0].data().stock;
      
      await updateDoc(docRef, {
        stock: currentStock - quantity,
        sold: (snapshot.docs[0].data().sold || 0) + quantity,
      });
    }
  };

  const value = {
    currentEvent,
    events,
    eventInventory,
    isLoading,
    isEventActive: !!currentEvent,
    getEvents,
    getMasterProducts,
    createEvent,
    closeEvent,
    getAvailableProducts,
    updateEventStock,
  };

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
};