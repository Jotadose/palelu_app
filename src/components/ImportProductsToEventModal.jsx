import React, { useState, useEffect } from "react";
import { Modal, Button } from "../components/UI";
import { useToast } from "../contexts/ToastContext";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query 
} from "firebase/firestore";
import { PackageIcon, PlusIcon, MinusIcon } from "../components/Icons";

// Modal para agregar productos del maestro al evento activo
export const ImportProductsToEventModal = ({ 
  isOpen, 
  onClose, 
  eventId, 
  appId 
}) => {
  const { showToast } = useToast();
  const [masterProducts, setMasterProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const db = getFirestore();

  // Cargar productos del maestro
  useEffect(() => {
    if (isOpen) {
      loadMasterProducts();
    }
  }, [isOpen]);

  const loadMasterProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const q = query(collection(db, `artifacts/${appId}/public/data/products`));
      const snapshot = await getDocs(q);
      const products = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(p => p.stock > 0);
      setMasterProducts(products);
    } catch (error) {
      console.error("Error cargando productos:", error);
      showToast("Error al cargar productos", "error");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleProductSelect = (productId) => {
    setSelectedProducts((prev) => {
      if (prev[productId]) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      const product = masterProducts.find(p => p.id === productId);
      return {
        ...prev,
        [productId]: {
          id: productId,
          name: product.name,
          price: product.price,
          stock: product.stock,
          initialStock: 1, // Default 1
          category: product.category,
          imageUrl: product.imageUrl,
        },
      };
    });
  };

  const handleStockChange = (productId, stock) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        initialStock: Math.max(1, Math.min(stock, parseInt(stock) || 1)),
      },
    }));
  };

  const handleImport = async () => {
    if (Object.keys(selectedProducts).length === 0) {
      showToast("Selecciona al menos un producto", "error");
      return;
    }

    setIsLoading(true);
    try {
      const inventoryPath = `artifacts/${appId}/public/data/events/${eventId}/eventInventories`;
      
      for (const product of Object.values(selectedProducts)) {
        await addDoc(collection(db, inventoryPath), {
          productId: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          imageUrl: product.imageUrl || "",
          initialStock: product.initialStock,
          currentStock: product.initialStock,
          sold: 0,
        });
      }

      showToast(`Se importaron ${Object.keys(selectedProducts).length} productos al evento`);
      setSelectedProducts({});
      onClose();
    } catch (error) {
      console.error("Error importando productos:", error);
      showToast("Error al importar productos", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📥 Importar Productos al Evento" fullScreenMobile>
      <div className="space-y-4 p-2 sm:p-4">
        {isLoadingProducts ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando productos...</p>
          </div>
        ) : masterProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <PackageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No hay productos en el inventario maestro</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Selecciona productos del maestro para agregar al evento
              </p>
              <span className="text-sm font-medium text-pink-600">
                {Object.keys(selectedProducts).length} seleccionados
              </span>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
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
                        onClick={() => handleProductSelect(product.id)}
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
                          <span className="text-xs text-gray-500">Cant:</span>
                          <button
                            type="button"
                            onClick={() => handleStockChange(product.id, (selectedData?.initialStock || 1) - 1)}
                            className="p-1 bg-gray-200 rounded-lg active:bg-gray-300"
                          >
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            value={selectedData?.initialStock || 1}
                            onChange={(e) => handleStockChange(product.id, e.target.value)}
                            className="w-12 text-center py-1 border border-gray-300 rounded-lg text-sm"
                            min="1"
                            max={product.stock}
                          />
                          <button
                            type="button"
                            onClick={() => handleStockChange(product.id, (selectedData?.initialStock || 1) + 1)}
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

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 text-base font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-xl active:bg-gray-200 touch-target"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={isLoading || Object.keys(selectedProducts).length === 0}
                className="flex-1 px-4 py-3 text-base font-medium text-white bg-pink-600 rounded-xl shadow-sm active:bg-pink-700 disabled:bg-pink-300 touch-target"
              >
                {isLoading ? "Importando..." : `Importar (${Object.keys(selectedProducts).length})`}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};