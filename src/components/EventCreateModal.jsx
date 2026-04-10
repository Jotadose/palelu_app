import React, { useState, useEffect } from "react";
import { Modal, Button } from "../components/UI";
import { useToast } from "../contexts/ToastContext";
import { CalendarIcon, PackageIcon, CopyIcon, PlusIcon, MinusIcon } from "../components/Icons";

export const EventCreateModal = ({ isOpen, onClose, onCreate, getMasterProducts }) => {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [importFromMaster, setImportFromMaster] = useState(true);
  const [masterProducts, setMasterProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: datos básicos, 2: seleccionar productos

  // Resetear cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setName("");
      setDate(new Date().toISOString().split("T")[0]);
      setImportFromMaster(true);
      setSelectedProducts({});
      setStep(1);
    }
  }, [isOpen]);

  // Cargar productos del maestro
  useEffect(() => {
    if (isOpen && importFromMaster) {
      loadMasterProducts();
    }
  }, [isOpen, importFromMaster]);

  const loadMasterProducts = async () => {
    try {
      const products = await getMasterProducts();
      setMasterProducts(products.filter(p => p.stock > 0));
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  const handleProductSelect = (productId, initialStock) => {
    setSelectedProducts((prev) => {
      if (prev[productId]) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [productId]: {
          id: productId,
          name: masterProducts.find(p => p.id === productId)?.name,
          price: masterProducts.find(p => p.id === productId)?.price,
          stock: masterProducts.find(p => p.id === productId)?.stock,
          initialStock: initialStock || 0,
          category: masterProducts.find(p => p.id === productId)?.category,
          imageUrl: masterProducts.find(p => p.id === productId)?.imageUrl,
        },
      };
    });
  };

  const handleStockChange = (productId, stock) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        initialStock: Math.max(0, Math.min(stock, parseInt(stock) || 0)),
      },
    }));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast("Ingresa un nombre para el evento", "error");
      return;
    }
    if (!date) {
      showToast("Selecciona una fecha para el evento", "error");
      return;
    }

    setIsLoading(true);
    try {
      const productsToImport = importFromMaster 
        ? Object.values(selectedProducts).filter(p => p.initialStock > 0)
        : [];
      
      await onCreate(name.trim(), date, importFromMaster, productsToImport);
      showToast("Evento creado exitosamente");
      onClose();
    } catch (error) {
      console.error("Error creando evento:", error);
      showToast("Error al crear el evento", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🎉 Crear Nuevo Evento" fullScreenMobile>
      <div className="space-y-4 p-2 sm:p-4">
        {/* Paso 1: Datos básicos */}
        {step === 1 && (
          <>
            {/* Nombre del evento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Nombre del Evento
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: River vs Boca - Copa Chile"
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 touch-target"
                autoComplete="off"
              />
            </div>

            {/* Fecha del evento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="w-4 h-4 inline mr-1" />
                Fecha del Evento
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 touch-target"
              />
            </div>

            {/* Opción de importación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <PackageIcon className="w-4 h-4 inline mr-1" />
                Tipo de Inventario
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setImportFromMaster(true)}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                    importFromMaster
                      ? "border-pink-500 bg-pink-50"
                      : "border-gray-200 bg-white active:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${importFromMaster ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                      <CopyIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">📋 Importar del Maestro</p>
                      <p className="text-sm text-gray-500">Copiar inventario actual del negocio</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setImportFromMaster(false)}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                    !importFromMaster
                      ? "border-pink-500 bg-pink-50"
                      : "border-gray-200 bg-white active:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${!importFromMaster ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                      <PlusIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">🆕 Empezar de Cero</p>
                      <p className="text-sm text-gray-500">Crear evento sin inventario previo</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Botón continuar */}
            {importFromMaster && (
              <button
                onClick={() => setStep(2)}
                className="w-full py-4 text-white text-lg font-bold bg-pink-600 rounded-xl shadow-lg active:bg-pink-700 transition-all touch-target"
              >
                Continuar - Seleccionar Productos →
              </button>
            )}

            {!importFromMaster && (
              <button
                onClick={handleSubmit}
                disabled={isLoading || !name.trim() || !date}
                className="w-full py-4 text-white text-lg font-bold bg-pink-600 rounded-xl shadow-lg active:bg-pink-700 disabled:bg-pink-300 transition-all touch-target"
              >
                {isLoading ? "Creando..." : "Crear Evento"}
              </button>
            )}
          </>
        )}

        {/* Paso 2: Seleccionar productos */}
        {step === 2 && importFromMaster && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Selecciona los productos</h3>
              <span className="text-sm text-gray-500">
                {Object.keys(selectedProducts).length} seleccionados
              </span>
            </div>

            {masterProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <PackageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No hay productos en el inventario maestro</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {masterProducts.map((product) => {
                  const isSelected = !!selectedProducts[product.id];
                  const selectedData = selectedProducts[product.id];
                  
                  return (
                    <div
                      key={product.id}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-pink-500 bg-pink-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleProductSelect(product.id, product.stock)}
                          className="flex items-center gap-3 flex-1"
                        >
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover"
                              onError={(e) => { e.target.style.display = "none"; }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <PackageIcon className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div className="text-left">
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-gray-500">
                              Stock maestro: {product.stock} | ${product.price?.toLocaleString("es-CL")}
                            </p>
                          </div>
                        </button>

                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Stock:</span>
                            <button
                              type="button"
                              onClick={() => handleStockChange(product.id, (selectedData?.initialStock || 0) - 1)}
                              className="p-1 bg-gray-200 rounded-lg active:bg-gray-300"
                            >
                              <MinusIcon className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              value={selectedData?.initialStock || 0}
                              onChange={(e) => handleStockChange(product.id, e.target.value)}
                              className="w-16 text-center py-1 border border-gray-300 rounded-lg text-sm"
                              min="0"
                              max={product.stock}
                            />
                            <button
                              type="button"
                              onClick={() => handleStockChange(product.id, (selectedData?.initialStock || 0) + 1)}
                              className="p-1 bg-gray-200 rounded-lg active:bg-gray-300"
                            >
                              <PlusIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Botones de navegación */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-3 text-base font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-xl active:bg-gray-200 touch-target"
              >
                ← Atrás
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading || Object.keys(selectedProducts).length === 0}
                className="flex-1 px-4 py-3 text-base font-medium text-white bg-pink-600 rounded-xl shadow-sm active:bg-pink-700 disabled:bg-pink-300 touch-target"
              >
                {isLoading ? "Creando..." : "Crear Evento"}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};