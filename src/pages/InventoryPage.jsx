import React, { useState, useEffect, useMemo } from "react";
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
import { Modal } from "../components/UI";
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
} from "../components/Icons";

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
      // Registrar movimiento de merma
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

      // Actualizar stock del producto
      await updateDoc(
        doc(db, `artifacts/${appId}/public/data/products`, product.id),
        { stock: product.stock - quantity }
      );

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
        {/* Info del producto */}
        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-14 h-14 rounded-lg object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <div>
            <p className="font-bold text-gray-800">{product.name}</p>
            <p className="text-sm text-gray-600">Stock actual: <span className="font-semibold text-green-600">{product.stock} unidades</span></p>
          </div>
        </div>

        {/* Cantidad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cantidad a dar de baja
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-3 bg-gray-100 rounded-xl active:bg-gray-200 touch-target"
            >
              <span className="text-xl font-bold">−</span>
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.min(product.stock, Math.max(1, parseInt(e.target.value) || 1)))}
              min="1"
              max={product.stock}
              className="flex-1 text-center text-2xl font-bold py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              type="button"
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              className="p-3 bg-gray-100 rounded-xl active:bg-gray-200 touch-target"
            >
              <span className="text-xl font-bold">+</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Nuevo stock: <span className="font-semibold text-red-600">{product.stock - quantity}</span> unidades
          </p>
        </div>

        {/* Razón */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Razón de la merma
          </label>
          <div className="grid grid-cols-2 gap-2">
            {reasons.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setReason(r.id)}
                className={`p-3 text-left rounded-xl border-2 transition-all ${
                  reason === r.id
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 bg-white active:bg-gray-50"
                }`}
              >
                <span className="font-medium text-sm">{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas (opcional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Venció el 28/11..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 touch-target"
          />
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4 pb-safe">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 text-base font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-xl active:bg-gray-200 touch-target"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || quantity < 1}
            className="flex-1 px-4 py-3 text-base font-medium text-white bg-red-600 rounded-xl shadow-sm active:bg-red-700 disabled:bg-red-300 touch-target"
          >
            {isLoading ? "Registrando..." : "Confirmar Merma"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const ProductForm = ({ onClose, appId, db, productToEdit }) => {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("🥤 Bebestible");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = React.useRef(null);
  const cameraInputRef = React.useRef(null);
  const isEditing = !!productToEdit;

  const categories = [
    "🥤 Bebestible",
    "🥖 Chaparrita",
    "🥟 Empanada",
    "🍕 Pizza",
    "🍬 Dulce",
    "🍟 Papas Fritas",
    "🥙 Snack Saludable",
    "🥓 Snack No Saludable",
    "🍪 Otro",
  ];

  useEffect(() => {
    if (isEditing) {
      setName(productToEdit.name);
      setPrice(productToEdit.price.toString());
      setStock(productToEdit.stock.toString());
      setCategory(productToEdit.category || "🍪 Otro");
      setImageUrl(productToEdit.imageUrl || "");
      setImagePreview(productToEdit.imageUrl || "");
    }
  }, [isEditing, productToEdit]);

  // Función para convertir imagen a Base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Función para comprimir imagen
  const compressImage = (base64, maxWidth = 400, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  // Manejar captura de imagen (cámara o galería)
  const handleImageCapture = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar que sea una imagen
    if (!file.type.startsWith('image/')) {
      showToast("Por favor selecciona una imagen válida", "error");
      return;
    }

    // Verificar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("La imagen es muy grande (máx 5MB)", "error");
      return;
    }

    setIsCapturing(true);
    try {
      const base64 = await convertToBase64(file);
      const compressed = await compressImage(base64);
      setImagePreview(compressed);
      setImageUrl(compressed); // Guardaremos el base64 como URL
      showToast("Imagen capturada ✓");
    } catch (error) {
      console.error("Error procesando imagen:", error);
      showToast("Error al procesar la imagen", "error");
    } finally {
      setIsCapturing(false);
    }
  };

  // Limpiar imagen
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
    } catch (err) {
      console.error("Error guardando producto: ", err);
      showToast("No se pudo guardar el producto.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-2 sm:p-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          ✍️ Nombre del Producto
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 touch-target"
          required
          autoComplete="off"
        />
      </div>

      {/* Sección de imagen con cámara */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📸 Imagen del Producto
        </label>
        
        {/* Preview de imagen */}
        {imagePreview ? (
          <div className="relative mb-3">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-40 object-contain bg-gray-100 rounded-xl border-2 border-gray-200"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg active:bg-red-600"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-full h-32 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center mb-3">
            <div className="text-center text-gray-400">
              <ImageIcon className="w-10 h-10 mx-auto mb-1" />
              <span className="text-xs">Sin imagen</span>
            </div>
          </div>
        )}

        {/* Botones de captura */}
        <div className="grid grid-cols-2 gap-2">
          {/* Botón Cámara */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isCapturing}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-pink-100 text-pink-700 rounded-xl font-medium active:bg-pink-200 disabled:opacity-50 touch-target"
          >
            <CameraIcon className="w-5 h-5" />
            <span className="text-sm">Cámara</span>
          </button>
          
          {/* Botón Galería */}
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

        {/* Inputs ocultos */}
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

        {/* Loading de captura */}
        {isCapturing && (
          <div className="mt-2 text-center text-sm text-gray-500">
            <span className="animate-pulse">Procesando imagen...</span>
          </div>
        )}

        {/* Input URL alternativo (colapsado) */}
        <details className="mt-3">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            O pegar URL de imagen...
          </summary>
          <input
            type="text"
            value={imageUrl.startsWith('data:') ? '' : imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              setImagePreview(e.target.value);
            }}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="mt-2 block w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </details>
      </div>

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
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
            className="mt-1 block w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 touch-target"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            📦 Stock
          </label>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            min="0"
            step="1"
            inputMode="numeric"
            className="mt-1 block w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 touch-target"
            required
          />
        </div>
      </div>
      <div className="flex gap-3 pt-4 pb-safe">
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
          {isLoading ? "Guardando..." : isEditing ? "Actualizar" : "Agregar"}
        </button>
      </div>
    </form>
  );
};

export const InventoryPage = ({ app, appId }) => {
  const { showToast } = useToast();
  const db = getFirestore(app);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mermaModalOpen, setMermaModalOpen] = useState(false);
  const [productForMerma, setProductForMerma] = useState(null);

  const openMermaModal = (product) => {
    setProductForMerma(product);
    setMermaModalOpen(true);
  };

  useEffect(() => {
    const q = query(collection(db, `artifacts/${appId}/public/data/products`));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setProducts(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        setIsLoading(false);
      },
      (error) => {
        console.error("Error al obtener productos:", error);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [db, appId]);

  const filteredProducts = useMemo(() => {
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

  const openAddModal = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (productId) => {
    if (
      window.confirm("¿Estás seguro de que quieres eliminar este producto?")
    ) {
      try {
        await deleteDoc(
          doc(db, `artifacts/${appId}/public/data/products`, productId)
        );
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

      {/* Header - Optimizado para móvil */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Inventario</h1>
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
          <button
            onClick={openAddModal}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-base font-medium text-white bg-pink-600 rounded-xl shadow-lg active:bg-pink-700 active:scale-[0.98] transition-all touch-target"
          >
            <PlusCircleIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Agregar</span>
          </button>
        </div>
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
            {searchTerm
              ? "No se encontraron productos"
              : "Tu inventario está vacío"}
          </h3>
          <p className="mt-2 text-gray-500">
            {searchTerm
              ? `Intenta con otra búsqueda.`
              : "¡Agrega tu primer producto para empezar a vender!"}
          </p>
        </div>
      ) : (
        Object.keys(groupedProducts)
          .sort()
          .map((category) => (
            <div
              key={category}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <h2 className="px-4 sm:px-6 py-3 sm:py-4 bg-pink-50 text-pink-800 font-bold text-sm sm:text-base sticky top-0 z-10">
                {category} ({groupedProducts[category].length})
              </h2>
              
              {/* Vista móvil - Cards */}
              <div className="sm:hidden divide-y">
                {groupedProducts[category].map((product) => (
                  <div
                    key={product.id}
                    className="p-4 flex items-center gap-3 active:bg-pink-50/50"
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => (e.target.style.display = "none")}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600">
                          ${product.price.toLocaleString("es-CL")}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            product.stock <= 5
                              ? "bg-red-100 text-red-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          {product.stock} unid.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openMermaModal(product)}
                        className="p-3 text-gray-500 active:text-orange-600 active:bg-orange-100 rounded-full touch-target"
                        title="Registrar merma"
                      >
                        <TrendingDownIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-3 text-gray-500 active:text-pink-600 active:bg-pink-100 rounded-full touch-target"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-3 text-gray-500 active:text-red-600 active:bg-red-100 rounded-full touch-target"
                      >
                        <Trash2Icon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vista desktop - Tabla */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {groupedProducts[category].map((product, index) => (
                      <tr
                        key={product.id}
                        className={`border-t ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        }`}
                      >
                        <td className="px-4 lg:px-6 py-3 flex items-center gap-4">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-10 w-10 rounded-md object-cover"
                              onError={(e) => (e.target.style.display = "none")}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <span className="font-medium text-gray-900">
                            {product.name}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-gray-600">
                          ${product.price.toLocaleString("es-CL")}
                        </td>
                        <td
                          className={`px-4 lg:px-6 py-4 font-semibold text-right ${
                            product.stock <= 5
                              ? "text-red-500"
                              : "text-green-600"
                          }`}
                        >
                          {product.stock}{" "}
                          <span className="text-xs text-gray-400">unid.</span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 w-36">
                          <div className="flex justify-end items-center gap-1">
                            <button
                              onClick={() => openMermaModal(product)}
                              className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-100 rounded-full transition-colors"
                              title="Registrar merma"
                            >
                              <TrendingDownIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(product)}
                              className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-100 rounded-full transition-colors"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                            >
                              <Trash2Icon className="w-4 h-4" />
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
