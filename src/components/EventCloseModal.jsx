import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button } from "../components/UI";
import { useToast } from "../contexts/ToastContext";
import { PackageIcon, TrashIcon, RefreshIcon, CheckCircleIcon } from "../components/Icons";

export const EventCloseModal = ({ isOpen, onClose, event, eventInventory, onCloseEvent }) => {
  const { showToast } = useToast();
  const [decisions, setDecisions] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Resetear decisiones cuando se abre el modal
  useEffect(() => {
    if (isOpen && eventInventory) {
      // Por defecto, reintegrar todo al maestro
      const defaultDecisions = {};
      eventInventory.forEach((item) => {
        defaultDecisions[item.productId] = "reintegrate";
      });
      setDecisions(defaultDecisions);
    }
  }, [isOpen, eventInventory]);

  // Calcular totales
  const stats = useMemo(() => {
    if (!eventInventory) return { totalSold: 0, totalRevenue: 0, productsWithStock: 0 };
    
    let totalSold = 0;
    let totalRevenue = 0;
    let productsWithStock = 0;

    eventInventory.forEach((item) => {
      const sold = (item.initialStock || 0) - (item.stock || 0);
      totalSold += sold;
      totalRevenue += sold * (item.price || 0);
      if (item.stock > 0) productsWithStock++;
    });

    return { totalSold, totalRevenue, productsWithStock };
  }, [eventInventory]);

  // Obtener productos vendidos (con venta > 0)
  const soldProducts = eventInventory?.filter((item) => {
    const sold = (item.initialStock || 0) - (item.stock || 0);
    return sold > 0;
  }) || [];

  // Obtener productos con stock剩余
  const remainingProducts = eventInventory?.filter((item) => item.stock > 0) || [];

  const handleDecisionChange = (productId, decision) => {
    setDecisions((prev) => ({
      ...prev,
      [productId]: decision,
    }));
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onCloseEvent(event.id, decisions);
      showToast("Evento cerrado exitosamente");
      onClose();
    } catch (error) {
      console.error("Error cerrando evento:", error);
      showToast("Error al cerrar el evento", "error");
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  };

  // Helper para calcular vendidos de un item
  const getSoldQuantity = (item) => {
    return (item.initialStock || 0) - (item.stock || 0);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔚 Cerrar Evento" size="lg" fullScreenMobile>
      <div className="space-y-4 p-2 sm:p-4">
        {/* Info del evento */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl p-4 text-white">
          <h3 className="font-bold text-lg">{event?.name}</h3>
          <p className="text-sm opacity-90">
            📅 {event?.date}
          </p>
        </div>

        {/* Stats del evento */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-pink-600">{stats.totalSold}</p>
            <p className="text-xs text-gray-500">Vendidos</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-600">${stats.totalRevenue.toLocaleString("es-CL")}</p>
            <p className="text-xs text-gray-500">Ingresos</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.productsWithStock}</p>
            <p className="text-xs text-gray-500">Stock Restante</p>
          </div>
        </div>

        {/* Productos vendidos */}
        {soldProducts.length > 0 && (
          <div>
            <h4 className="font-bold text-gray-800 mb-2">📊 Productos Vendidos</h4>
            <div className="space-y-2 max-h-[25vh] overflow-y-auto">
              {soldProducts.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between bg-green-50 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-green-600">
                      {getSoldQuantity(item)} unid.
                    </span>
                    <span className="block text-xs text-gray-500">
                      ${(getSoldQuantity(item) * (item.price || 0)).toLocaleString("es-CL")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Productos con stock剩余 - decisión */}
        {remainingProducts.length > 0 && (
          <div>
            <h4 className="font-bold text-gray-800 mb-2">
              📦 Stock Restante ({remainingProducts.length} productos)
            </h4>
            <p className="text-sm text-gray-500 mb-3">
              ¿Qué hacer con el stock no vendido?
            </p>
            <div className="space-y-2 max-h-[30vh] overflow-y-auto">
              {remainingProducts.map((item) => (
                <div
                  key={item.productId}
                  className="bg-orange-50 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{item.name}</span>
                    <span className="text-sm font-bold text-orange-600">
                      {item.stock} unid.
                    </span>
                  </div>
                  
                  {/* Opciones de decisión */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecisionChange(item.productId, "reintegrate")}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                        decisions[item.productId] === "reintegrate"
                          ? "bg-green-600 text-white"
                          : "bg-white border-2 border-gray-200 text-gray-600 active:bg-gray-50"
                      }`}
                    >
                      <RefreshIcon className="w-4 h-4" />
                      Reintegrar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecisionChange(item.productId, "discard")}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                        decisions[item.productId] === "discard"
                          ? "bg-red-600 text-white"
                          : "bg-white border-2 border-gray-200 text-gray-600 active:bg-gray-50"
                      }`}
                    >
                      <TrashIcon className="w-4 h-4" />
                      Descartar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Si no hay productos vendidos ni stock剩余 */}
        {soldProducts.length === 0 && remainingProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <PackageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No hay productos en el inventario del evento</p>
          </div>
        )}

        {/* Botón confirmar */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-base font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-xl active:bg-gray-200 touch-target"
          >
            Cancelar
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-base font-medium text-white bg-red-600 rounded-xl shadow-sm active:bg-red-700 disabled:bg-red-300 touch-target"
          >
            {isLoading ? "Cerrando..." : "Confirmar Cierre"}
          </button>
        </div>

        {/* Modal de confirmación */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="font-bold text-lg text-center mb-2">¿Confirmar cierre?</h3>
              <p className="text-sm text-gray-600 text-center mb-4">
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-3 text-base font-medium text-gray-700 bg-gray-100 rounded-xl active:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 text-base font-medium text-white bg-red-600 rounded-xl active:bg-red-700 disabled:bg-red-300"
                >
                  Sí, cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};