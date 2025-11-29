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
} from "firebase/firestore";
import { useToast } from "../contexts/ToastContext";
import { Modal } from "../components/UI";
import {
  SearchIcon,
  PlusCircleIcon,
  EditIcon,
  Trash2Icon,
  ImageIcon,
} from "../components/Icons";

const ProductForm = ({ onClose, appId, db, productToEdit }) => {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("🥤 Bebestible");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    }
  }, [isEditing, productToEdit]);

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
      <div>
        <label className="block text-sm font-medium text-gray-700">
          🖼️ URL de la Imagen (Opcional)
        </label>
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://ejemplo.com/imagen.jpg"
          className="mt-1 block w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 touch-target"
          autoComplete="off"
        />
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
                        <td className="px-4 lg:px-6 py-4 w-28">
                          <div className="flex justify-end items-center gap-1">
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
