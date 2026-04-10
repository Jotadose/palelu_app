import React, { useState, useEffect, useRef } from "react";
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { useToast } from "../contexts/ToastContext";
import { useEvent } from "../contexts/EventContext";
import { Modal } from "../components/UI";
import { ImportProductsToEventModal } from "../components/ImportProductsToEventModal";
import {
  SearchIcon,
  PlusCircleIcon,
  EditIcon,
  Trash2Icon,
  ImageIcon,
  CameraIcon,
  UploadIcon,
  XIcon,
  TrendingDownIcon,
  CopyIcon,
} from "../components/Icons";

// Categorías por defecto
const defaultCategories = [
  "Hamburguesas",
  "Pizzas",
  "Bebidas",
  "Complementos",
  "Postres",
  "Otros",
];

// Compresión de imagen
const compressImage = async (base64Str) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxSize = 400;
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
  });
};

const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Modal para crear producto exclusivo del evento
const CreateEventProductModal = ({ isOpen, onClose, eventId, appId, db }) => {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("Otros");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [categories, setCategories] = useState(defaultCategories);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Resetear cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setPrice("");
      setStock("");
      setCategory("Otros");
      setImageUrl("");
      setImagePreview("");
    }
  }, [isOpen]);

  const handleImageCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCapturing(true);
    try {
      const base64 = await convertToBase64(file);
      const compressed = await compressImage(base64);
      setImagePreview(compressed);
      setImageUrl(compressed);
      showToast("Imagen capturada ✓");
    } catch (error) {
      console.error("Error procesando imagen:", error);
      showToast("Error al procesar la imagen", "error");
    } finally {
      setIsCapturing(false);
    }
  };

  const clearImage = () => {
    setImageUrl("");
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !stock) {
      showToast("Nombre, precio y stock son obligatorios.", "error");
      return;
    }
    setIsLoading(true);
    try {
      const productData = {
        name,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        category,
        imageUrl: imageUrl.trim(),
        active: true,
        isEventExclusive: true, // Marca como producto exclusivo del evento
      };

      // Agregar al inventario del evento
      const inventoryPath = `artifacts/${appId}/public/data/events/${eventId}/eventInventories`;
      await addDoc(collection(db, inventoryPath), {
        ...productData,
        productId: null, // No tiene对应 en el maestro
        initialStock: parseInt(stock, 10),
        currentStock: parseInt(stock, 10),
        sold: 0,
        createdAt: Timestamp.now(),
      });

      showToast("Producto creado para el evento ✓");
      onClose();
    } catch (error) {
      console.error("Error creando producto:", error);
      showToast("Error al crear el producto", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🎉 Crear Producto para Evento" fullScreenMobile>
      <form onSubmit={handleSubmit} className="space-y-4 p-2 sm:p-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            📝 Nombre del Producto
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Choripán Especial"
            className="mt-1 block w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 touch-target"
            required
          />
        </div>

        {/* Precio y Stock */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              💸 Precio
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="1"
              inputMode="numeric"
              className="mt-1 block w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 touch-target"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              📦 Stock Inicial
            </label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              min="0"
              step="1"
              inputMode="numeric"
              className="mt-1 block w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 touch-target"
              required
            />
          </div>
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            🗃️ Categoría
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full pl-4 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 rounded-xl touch-target"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Imagen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📷 Imagen (opcional)
          </label>
          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-24 h-24 object-cover rounded-xl"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isCapturing}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-xl font-medium active:bg-green-200 disabled:opacity-50 touch-target"
              >
                <CameraIcon className="w-5 h-5" />
                <span className="text-sm">Cámara</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCapturing}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-xl font-medium active:bg-blue-200 disabled:opacity-50 touch-target"
              >
                <UploadIcon className="w-5 h-5" />
                <span className="text-sm">Galería</span>
              </button>
            </div>
          )}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageCapture}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageCapture}
            className="hidden"
          />
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 text-base font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-xl active:bg-gray-200 touch-target"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-base font-medium text-white bg-pink-600 border border-transparent rounded-xl shadow-sm active:bg-pink-700 disabled:bg-pink-300 touch-target"
          >
            {isLoading ? "Guardando..." : "Crear Producto"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Modal de Merma de Producto
const MermaModal = ({ isOpen, onClose, product, appId, db, onSuccess }) => {
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("vencido");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const reasons = [
    { id: "vencido", label: "📅 Vencido", description: "Producto expirado" },
    { id: "roto", label: "💔 Roto/Dañado", description: "Embalaje dañado" },
    { id: "muestra", label: "🎁 Muestra/Regalo", description: "Entregado sin cobro" },
    { id: "consumo", label: "🍽️ Consumo interno", description: "Usado en el negocio" },
    { id: "ajuste", label: "🔢 Ajuste inventario", description: "Diferencia en conteo" },
    { id: "otro", label: "❓ Otro", description: "Especificar en notas" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product || quantity < 1 || quantity > product.stock) return;

    setIsLoading(true);
    try {
      const movementData = {
        productId: product.id,
        productName: product.name,
        type: "merma",
        quantity: -quantity,
        reason,
        notes: notes.trim(),
        previousStock: product.stock,
        newStock: product.stock - quantity,
        createdAt: Timestamp.now(),
      };

      await addDoc(
        collection(db, `artifacts/${appId}/public/data/inventory_movements`),
        movementData
      );

      // Determinar la ruta según si es producto del evento o del maestro
      let productRef;
      if (product.isEventProduct) {
        // Producto del evento
        productRef = doc(db, `artifacts/${appId}/public/data/events/${product.eventId}/eventInventories`, product.id);
      } else {
        // Producto del maestro
        productRef = doc(db, `artifacts/${appId}/public/data/products`, product.id);
      }

      await updateDoc(productRef, { stock: product.stock - quantity });

      showToast(`Merma registrada: -${quantity} ${product.name}`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error registrando merma:", error);
      showToast("Error al registrar merma", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📉 Registrar Merma" fullScreenMobile>
      <form onSubmit={handleSubmit} className="space-y-4 p-2 sm:p-4">
        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-14 h-14 rounded-lg object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <div>
            <p className="font-bold">{product.name}</p>
            <p className="text-sm text-gray-500">Stock actual: {product.stock}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad a descartar</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
            min="1"
            max={product.stock}
            className="w-full px-4 py-3 text-lg font-bold text-center border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Motivo</label>
          <div className="grid grid-cols-2 gap-2">
            {reasons.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setReason(r.id)}
                className={`p-3 text-left rounded-lg border-2 transition-all ${
                  reason === r.id
                    ? "border-pink-500 bg-pink-50"
                    : "border-gray-200 active:border-gray-300"
                }`}
              >
                <p className="font-medium text-sm">{r.label}</p>
                <p className="text-xs text-gray-500">{r.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Detalles adicionales..."
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
            rows={2}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 text-base font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-xl active:bg-gray-200 touch-target"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-base font-medium text-white bg-red-600 border border-transparent rounded-xl shadow-sm active:bg-red-700 disabled:bg-red-300 touch-target"
          >
            {isLoading ? "Guardando..." : "Registrar Merma"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Formulario para producto del maestro (reutilizado)
const ProductForm = ({ onClose, appId, db, productToEdit }) => {
  const { showToast } = useToast();
  const isEditing = !!productToEdit?.id;

  const [name, setName] = useState(productToEdit?.name || "");
  const [price, setPrice] = useState(productToEdit?.price?.toString() || "");
  const [stock, setStock] = useState(productToEdit?.stock?.toString() || "");
  const [category, setCategory] = useState(productToEdit?.category || "Otros");
  const [imageUrl, setImageUrl] = useState(productToEdit?.imageUrl || "");
  const [imagePreview, setImagePreview] = useState(productToEdit?.imageUrl || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [categories, setCategories] = useState(defaultCategories);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setCategories(defaultCategories);
  }, []);

  const handleImageCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCapturing(true);
    try {
      const base64 = await convertToBase64(file);
      const compressed = await compressImage(base64);
      setImagePreview(compressed);
      setImageUrl(compressed);
      showToast("Imagen capturada ✓");
    } catch (error) {
      console.error("Error procesando imagen:", error);
      showToast("Error al procesar la imagen", "error");
    } finally {
      setIsCapturing(false);
    }
  };

  const clearImage = () => {
    setImageUrl("");
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !stock) {
      showToast("Nombre, precio y stock son obligatorios.", "error");
      return;
    }
    setIsLoading(true);
    try {
      const productData = {
        name,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        category,
        imageUrl: imageUrl.trim(),
        active: true,
      };
      const collectionPath = `artifacts/${appId}/public/data/products`;
      if (isEditing) {
        await updateDoc(doc(db, collectionPath, productToEdit.id), productData);
        showToast("Producto actualizado con éxito");
      } else {
        await addDoc(collection(db, collectionPath), {
          ...productData,
          createdAt: new Date(),
        });
        showToast("Producto agregado con éxito");
      }
      onClose();
    } catch (error) {
      console.error("Error guardando producto:", error);
      showToast("Error al guardar el producto", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-2 sm:p-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">📝 Nombre</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del producto"
          className="mt-1 block w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">💸 Precio</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0"
            step="1"
            inputMode="numeric"
            className="mt-1 block w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">📦 Stock</label>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            min="0"
            step="1"
            inputMode="numeric"
            className="mt-1 block w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">🗃️ Categoría</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 block w-full pl-4 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 rounded-xl"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">📷 Imagen</label>
        {imagePreview ? (
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-xl" />
            <button type="button" onClick={clearImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={isCapturing} className="flex items-center justify-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-xl font-medium active:bg-green-200 disabled:opacity-50">
              <CameraIcon className="w-5 h-5" />
              <span className="text-sm">Cámara</span>
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isCapturing} className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-xl font-medium active:bg-blue-200 disabled:opacity-50">
              <UploadIcon className="w-5 h-5" />
              <span className="text-sm">Galería</span>
            </button>
          </div>
        )}
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageCapture} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageCapture} className="hidden" />
      </div>

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-3 text-base font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-xl active:bg-gray-200">Cancelar</button>
        <button type="submit" disabled={isLoading} className="flex-1 px-4 py-3 text-base font-medium text-white bg-pink-600 border border-transparent rounded-xl shadow-sm active:bg-pink-700 disabled:bg-pink-300">
          {isLoading ? "Guardando..." : isEditing ? "Actualizar" : "Agregar"}
        </button>
      </div>
    </form>
  );
};

export const InventoryPage = ({ app, appId }) => {
  const { showToast } = useToast();
  const { currentEvent, eventInventory, isEventActive, getMasterProducts, createEvent } = useEvent();
  const db = getFirestore(app);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mermaModalOpen, setMermaModalOpen] = useState(false);
  const [productForMerma, setProductForMerma] = useState(null);
  const [inventoryView, setInventoryView] = useState("maestro");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCreateEventProductModal, setShowCreateEventProductModal] = useState(false);

  const displayProducts = useMemo(() => {
    if (inventoryView === "evento" && isEventActive && eventInventory.length > 0) {
      return eventInventory;
    }
    return products;
  }, [inventoryView, isEventActive, eventInventory, products]);

  const openMermaModal = (product) => {
    setProductForMerma(product);
    setMermaModalOpen(true);
  };

  useEffect(() => {
    const q = query(collection(db, `artifacts/${appId}/public/data/products`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    }, (error) => {
      console.error("Error al obtener productos:", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [db, appId]);

  const filteredProducts = useMemo(() => {
    return displayProducts.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [displayProducts, searchTerm]);

  const groupedProducts = useMemo(() => {
    if (filteredProducts.length === 0) return {};
    return filteredProducts.reduce((acc, product) => {
      const category = product.category || "Sin Categoría";
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {});
  }, [filteredProducts]);

  const openAddModal = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const openAddToEventModal = () => {
    // Mostrar opciones: importar del maestro O crear producto exclusivo
    setShowImportModal(true);
  };

  const openCreateEventProductModal = () => {
    setShowCreateEventProductModal(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      try {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/products`, productId));
        showToast("Producto eliminado");
      } catch (error) {
        console.error("Error al eliminar producto:", error);
        showToast("No se pudo eliminar el producto", "error");
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-safe">
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={productToEdit ? "Editar Producto" : "Agregar Nuevo Producto"}
        fullScreenMobile
      >
        <ProductForm
          onClose={() => setIsModalOpen(false)}
          appId={appId}
          db={db}
          productToEdit={productToEdit}
        />
      </Modal>

      <MermaModal
        isOpen={mermaModalOpen}
        onClose={() => setMermaModalOpen(false)}
        product={productForMerma}
        appId={appId}
        db={db}
        onSuccess={() => setProductForMerma(null)}
      />

      <ImportProductsToEventModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        eventId={currentEvent?.id}
        appId={appId}
      />

      <CreateEventProductModal
        isOpen={showCreateEventProductModal}
        onClose={() => setShowCreateEventProductModal(false)}
        eventId={currentEvent?.id}
        appId={appId}
        db={db}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">📦 Inventario</h1>
          <p className="text-gray-500 text-sm">Gestiona tus productos</p>
        </div>
        {/* Selector de vista */}
        {currentEvent && isEventActive && (
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setInventoryView("maestro")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                inventoryView === "maestro"
                  ? "bg-white text-pink-600 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              🏠 Maestro
            </button>
            <button
              onClick={() => setInventoryView("evento")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                inventoryView === "evento"
                  ? "bg-white text-pink-600 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              🎉 Evento
            </button>
          </div>
        )}
      </div>

      {inventoryView === "evento" && currentEvent && (
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-3 flex items-center gap-2">
          <span className="text-sm">📦 Inventario de:</span>
          <span className="font-bold text-pink-700">{currentEvent.name}</span>
          <span className="text-xs text-gray-500">
            ({eventInventory.reduce((sum, p) => sum + (p.currentStock || p.stock || 0), 0)} unid.)
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-64">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 touch-target"
            autoComplete="off"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        {/* Botón principal con dropdown para evento */}
        {inventoryView === "evento" && currentEvent ? (
          <div className="relative group">
            <button
              className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-base font-medium text-white bg-pink-600 rounded-xl shadow-lg active:bg-pink-700 transition-all touch-target"
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Agregar</span>
            </button>
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 hidden group-hover:block">
              <button
                onClick={openAddToEventModal}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 rounded-t-xl"
              >
                <CopyIcon className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">📥 Importar del Maestro</p>
                  <p className="text-xs text-gray-500">Copiar productos existentes</p>
                </div>
              </button>
              <button
                onClick={openCreateEventProductModal}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 rounded-b-xl"
              >
                <PlusCircleIcon className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-sm">🆕 Crear Producto Exclusivo</p>
                  <p className="text-xs text-gray-500">Solo para este evento</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={openAddModal}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-base font-medium text-white bg-pink-600 rounded-xl shadow-lg active:bg-pink-700 active:scale-[0.98] transition-all touch-target"
          >
            <PlusCircleIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Agregar</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center text-gray-500 py-10">
          <svg className="animate-spin h-8 w-8 mx-auto mb-2 text-pink-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Cargando inventario...
        </div>
      ) : Object.keys(groupedProducts).length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-xl shadow-md">
          <h3 className="text-xl font-medium text-gray-700">
            {searchTerm ? "No se encontraron productos" : "Tu inventario está vacío"}
          </h3>
          <p className="mt-2 text-gray-500">
            {searchTerm ? "Intenta con otra búsqueda." : "¡Agrega tu primer producto para empezar a vender!"}
          </p>
        </div>
      ) : (
        Object.keys(groupedProducts)
          .sort()
          .map((category) => (
            <div key={category} className="bg-white rounded-xl shadow-md overflow-hidden">
              <h2 className="px-4 sm:px-6 py-3 sm:py-4 bg-pink-50 text-pink-800 font-bold text-sm sm:text-base sticky top-0 z-10">
                {category} ({groupedProducts[category].length})
              </h2>
              
              {/* Vista móvil - Cards */}
              <div className="sm:hidden divide-y">
                {groupedProducts[category].map((product) => (
                  <div key={product.id} className="p-4">
                    <div className="flex items-start gap-3">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-16 h-16 rounded-lg object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-800">{product.name}</p>
                            <p className="text-sm text-pink-600 font-bold">${product.price?.toLocaleString("es-CL")}</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${product.stock <= 5 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                              {product.stock || product.currentStock || 0}
                            </span>
                            {inventoryView === "evento" && product.isEventExclusive && (
                              <span className="block text-[10px] text-orange-500 mt-1">🎉 Exclusivo</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          {inventoryView === "maestro" && (
                            <button onClick={() => { setProductToEdit(product); setIsModalOpen(true); }} className="text-xs text-blue-600 hover:underline">Editar</button>
                          )}
                          <button onClick={() => openMermaModal({ ...product, isEventProduct: inventoryView === "evento" })} className="text-xs text-red-600 hover:underline">Merma</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vista desktop - Tabla */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-500">Producto</th>
                      <th className="px-4 py-3 font-medium text-gray-500">Precio</th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-center">Stock</th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedProducts[category].map((product, index) => (
                      <tr key={product.id} className={`border-t ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-gray-300" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-800">{product.name}</p>
                              {inventoryView === "evento" && product.isEventExclusive && (
                                <span className="text-[10px] text-orange-500">🎉 Exclusivo del evento</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-pink-600 font-bold">${product.price?.toLocaleString("es-CL")}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${product.stock <= 5 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                            {product.stock || product.currentStock || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {inventoryView === "maestro" && (
                              <button onClick={() => { setProductToEdit(product); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar">
                                <EditIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => openMermaModal({ ...product, isEventProduct: inventoryView === "evento" })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Registrar merma">
                              <TrendingDownIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
      )}
    </div>
  );
};