import React, {
  useState,
  useEffect,
  useMemo,
  createContext,
  useContext,
} from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  writeBatch,
  query,
} from "firebase/firestore";
import { setLogLevel } from "firebase/firestore";

// --- Configuración de Firebase ---
import { firebaseConfig } from "./firebaseConfig";

// --- Íconos Temáticos ---
const PizzaIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 11h.01" />
    <path d="M11 15h.01" />
    <path d="M16 16h.01" />
    <path d="m2 16 2.24 1.12a2 2 0 0 0 1.52-.22L8 15.5l.9 2.4c.27.73 1.1.98 1.8.7l5.4-2.02c.56-.21.9-.76.9-1.38V4.4c0-.55-.34-1.05-.85-1.25L12 2 4.15 3.15c-.5.2-.85.7-.85 1.25v10.2c0 .4.2.78.53.98Z" />
  </svg>
);
const ShoppingCartIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.16" />
  </svg>
);
const PlusCircleIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);
const Trash2Icon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);
const EditIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);
const XIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const PackageIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v2" />
    <path d="M21 14v2a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16v-2" />
    <path d="M3 10v4" />
    <path d="M21 10v4" />
    <path d="M12 22V12" />
    <path d="m7 12-5-2.5" />
    <path d="m17 12 5-2.5" />
  </svg>
);
const LogOutIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const ImageIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);
const CheckCircleIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const AlertCircleIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const DollarSignIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const StarIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const SearchIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

// --- Inicialización de Firebase ---
let app, auth, db, appId;
try {
  appId = firebaseConfig.appId;
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  setLogLevel("error");
} catch (error) {
  console.error("Error al inicializar Firebase.", error);
}

// --- Sistema de Notificaciones (Toast) ---
const ToastContext = createContext();
const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => setToast(null), 3000);
  };
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </ToastContext.Provider>
  );
};
const useToast = () => useContext(ToastContext);
const Toast = ({ message, type, onClose }) => {
  const isSuccess = type === "success";
  const bgColor = isSuccess ? "bg-green-500" : "bg-red-500";
  const Icon = isSuccess ? CheckCircleIcon : AlertCircleIcon;
  return (
    <div
      className={`fixed top-5 right-5 flex items-center p-4 rounded-lg shadow-lg text-white ${bgColor} z-[100] animate-fade-in-down`}
    >
      <Icon className="w-6 h-6 mr-3" />
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-4 p-1 rounded-full hover:bg-white/20"
      >
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

// --- Componentes de la UI ---
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-2 md:p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const ProductForm = ({ onClose, userId, productToEdit }) => {
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
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <label
          htmlFor="product-name"
          className="block text-sm font-medium text-gray-700"
        >
          ✍️ Nombre del Producto
        </label>
        <input
          id="product-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
          required
        />
      </div>
      <div>
        <label
          htmlFor="product-image"
          className="block text-sm font-medium text-gray-700"
        >
          🖼️ URL de la Imagen (Opcional)
        </label>
        <input
          id="product-image"
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://ejemplo.com/imagen.jpg"
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
        />
      </div>
      <div>
        <label
          htmlFor="product-category"
          className="block text-sm font-medium text-gray-700"
        >
          🗃️ Categoría
        </label>
        <select
          id="product-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-md"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="product-price"
            className="block text-sm font-medium text-gray-700"
          >
            💸 Precio
          </label>
          <input
            id="product-price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0"
            step="0.01"
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="product-stock"
            className="block text-sm font-medium text-gray-700"
          >
            📦 Stock
          </label>
          <input
            id="product-stock"
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            min="0"
            step="1"
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md shadow-sm hover:bg-pink-700 disabled:bg-pink-300"
        >
          {isLoading ? "Guardando..." : isEditing ? "Actualizar" : "Agregar"}
        </button>
      </div>
    </form>
  );
};

const InventoryPage = ({ user }) => {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user || !db) return;
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
  }, [user]);

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
    <div className="space-y-6">
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={productToEdit ? "Editar Producto" : "Agregar Nuevo Producto"}
      >
        <ProductForm
          onClose={() => setIsModalOpen(false)}
          userId={user.uid}
          productToEdit={productToEdit}
        />
      </Modal>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Inventario</h1>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <button
            onClick={openAddModal}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-full shadow-lg hover:bg-pink-700 transition-all transform hover:scale-105"
          >
            <PlusCircleIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Agregar</span>
          </button>
        </div>
      </div>
      {isLoading ? (
        <p className="text-center text-gray-500 py-10">
          Cargando inventario...
        </p>
      ) : Object.keys(groupedProducts).length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-lg shadow-md">
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
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <h2 className="px-6 py-4 bg-pink-50 text-pink-800 font-bold text-md">
                {category}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {groupedProducts[category].map((product, index) => (
                      <tr
                        key={product.id}
                        className={`border-t ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        } hover:bg-pink-50/50`}
                      >
                        <td className="px-6 py-3 flex items-center gap-4">
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
                        <td className="px-6 py-4 text-gray-600">
                          ${product.price.toFixed(2)}
                        </td>
                        <td
                          className={`px-6 py-4 font-semibold text-right ${
                            product.stock <= 5
                              ? "text-red-500"
                              : "text-green-600"
                          }`}
                        >
                          {product.stock}{" "}
                          <span className="text-xs text-gray-400">unid.</span>
                        </td>
                        <td className="px-6 py-4 w-28">
                          <div className="flex justify-end items-center gap-2">
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

const SalesForm = ({ userId, products, onClose }) => {
  const { showToast } = useToast();
  const [cart, setCart] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const currentQty = prevCart[product.id]?.quantity || 0;
      if (currentQty >= product.stock) {
        showToast(`No hay más stock de ${product.name}`, "error");
        return prevCart;
      }
      return {
        ...prevCart,
        [product.id]: { ...product, quantity: currentQty + 1 },
      };
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const newCart = { ...prevCart };
      if (newCart[productId].quantity > 1) {
        newCart[productId].quantity -= 1;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const total = useMemo(
    () =>
      Object.values(cart).reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    [cart]
  );

  const handleSubmitSale = async () => {
    if (Object.keys(cart).length === 0) return;
    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      const salesCollectionPath = `artifacts/${appId}/public/data/sales`;
      const productsCollectionPath = `artifacts/${appId}/public/data/products`;

      for (const item of Object.values(cart)) {
        const saleRef = doc(collection(db, salesCollectionPath));
        batch.set(saleRef, {
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          pricePerUnit: item.price,
          totalPrice: item.price * item.quantity,
          saleDate: new Date(),
          sellerId: userId,
        });
        const productRef = doc(db, productsCollectionPath, item.id);
        batch.update(productRef, { stock: item.stock - item.quantity });
      }
      await batch.commit();
      showToast("Venta registrada con éxito");
      onClose();
    } catch (error) {
      console.error("Error al registrar la venta:", error);
      showToast("Hubo un error al registrar la venta", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const groupedProducts = useMemo(() => {
    if (products.length === 0) return {};
    return products.reduce((acc, product) => {
      const category = product.category || "Sin Categoría";
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {});
  }, [products]);

  return (
    <div className="flex flex-col md:flex-row h-[70vh]">
      <div className="w-full md:w-3/5 p-2 space-y-3 overflow-y-auto">
        {Object.keys(groupedProducts)
          .sort()
          .map((category) => (
            <div key={category}>
              <h3 className="font-bold text-primary-dark mb-2 sticky top-0 bg-white/80 backdrop-blur-sm py-1">
                {category}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {groupedProducts[category].map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className="relative p-2 text-center bg-white rounded-lg shadow-sm border-2 border-gray-200 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary hover:border-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all aspect-square flex flex-col justify-center items-center"
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-16 h-16 object-contain mb-2"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://placehold.co/100x100/d8b4fe/4c1d95?text=Error";
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 mb-2 flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                    <span className="font-semibold text-sm text-text-primary leading-tight">
                      {product.name}
                    </span>
                    <span className="block text-xs text-text-secondary">
                      ${product.price.toFixed(2)}
                    </span>
                    <span
                      className={`absolute top-1 right-1 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                        product.stock <= 5
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {product.stock}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
      </div>
      <div className="w-full md:w-2/5 p-4 bg-gray-50 border-l flex flex-col">
        <h3 className="text-xl font-bold mb-4 text-text-primary">
          Pedido Actual
        </h3>
        <div className="flex-grow overflow-y-auto -mr-2 pr-2">
          {Object.keys(cart).length === 0 ? (
            <p className="text-text-secondary text-center mt-10">
              Selecciona productos para agregarlos al pedido.
            </p>
          ) : (
            <ul className="space-y-3">
              {Object.values(cart).map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm"
                >
                  <div>
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-text-secondary">
                      ${item.price.toFixed(2)} x {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-md text-primary">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 text-red-500 hover:bg-red-100 rounded-full"
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center font-bold text-2xl text-text-primary">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button
            onClick={handleSubmitSale}
            disabled={isLoading || Object.keys(cart).length === 0}
            className="w-full mt-4 py-3 text-white font-bold bg-primary rounded-lg shadow-md hover:bg-primary-dark disabled:bg-primary-light/50 transition-colors"
          >
            {isLoading ? "Procesando..." : "Pagar"}
          </button>
        </div>
      </div>
    </div>
  );
};

const SalesPage = ({ user }) => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  useEffect(() => {
    if (!user || !db) return;
    const salesQuery = query(
      collection(db, `artifacts/${appId}/public/data/sales`)
    );
    const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
      const salesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      salesData.sort((a, b) => b.saleDate.toDate() - a.saleDate.toDate());
      setSales(salesData);
      setIsLoading(false);
    });
    const productsQuery = query(
      collection(db, `artifacts/${appId}/public/data/products`)
    );
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubscribeSales();
      unsubscribeProducts();
    };
  }, [user]);

  const dashboardStats = useMemo(() => {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalItemsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const productSales = sales.reduce((acc, sale) => {
      acc[sale.productName] = (acc[sale.productName] || 0) + sale.quantity;
      return acc;
    }, {});
    let bestSellingProduct = "N/A";
    let maxQuantity = 0;
    for (const [productName, quantity] of Object.entries(productSales)) {
      if (quantity > maxQuantity) {
        maxQuantity = quantity;
        bestSellingProduct = productName;
      }
    }
    return { totalRevenue, totalItemsSold, bestSellingProduct };
  }, [sales]);

  return (
    <div className="space-y-8">
      <Modal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        title="Terminal de Venta Rápida"
      >
        <SalesForm
          userId={user.uid}
          products={products}
          onClose={() => setIsSaleModalOpen(false)}
        />
      </Modal>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">
          Dashboard de Ventas
        </h1>
        <button
          onClick={() => setIsSaleModalOpen(true)}
          disabled={products.filter((p) => p.stock > 0).length === 0}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-secondary rounded-full shadow-lg hover:bg-secondary-dark transition-all transform hover:scale-105"
        >
          <PlusCircleIcon className="w-5 h-5" />
          <span>Nueva Venta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Recaudado"
          value={`$${dashboardStats.totalRevenue.toFixed(2)}`}
          icon={DollarSignIcon}
        />
        <StatCard
          title="Productos Vendidos"
          value={dashboardStats.totalItemsSold}
          icon={ShoppingCartIcon}
        />
        <StatCard
          title="Producto Estrella"
          value={dashboardStats.bestSellingProduct}
          icon={StarIcon}
        />
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="px-6 py-4 bg-gray-50 text-primary-dark font-bold text-md">
          Historial de Transacciones
        </h2>
        <div className="overflow-x-auto">
          {isLoading ? (
            <p className="p-6 text-center text-text-secondary">
              Cargando ventas...
            </p>
          ) : sales.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              <h3 className="text-lg font-medium">No hay ventas registradas</h3>
              <p className="mt-1">¡Realiza tu primera venta para verla aquí!</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {sales.map((sale, index) => (
                  <tr
                    key={sale.id}
                    className={`border-t ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    } hover:bg-gray-50/50`}
                  >
                    <td className="px-6 py-4 font-medium text-text-primary">
                      {sale.productName}
                      <span className="ml-2 text-text-secondary">
                        x{sale.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell text-text-secondary text-right">
                      {new Date(
                        sale.saleDate.seconds * 1000
                      ).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-text-primary text-right">
                      ${sale.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError("Correo o contraseña incorrectos.");
      console.error("Error de inicio de sesión:", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-default">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="inline-block bg-primary p-3 rounded-full shadow-md">
            <PizzaIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-text-primary">
            Palelu Spa
          </h1>
          <p className="text-text-secondary">Punto de Venta</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary"
              placeholder="Correo Electrónico"
            />
          </div>
          <div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary"
              placeholder="Contraseña"
            />
          </div>
          {error && <p className="text-sm text-center text-red-500">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:bg-primary-light/50"
            >
              {isLoading ? "Ingresando..." : "Ingresar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AppContent = ({ user }) => {
  const [page, setPage] = useState("sales"); // Iniciar en la página de ventas

  const handleLogout = () => {
    signOut(auth).catch((error) =>
      console.error("Error al cerrar sesión:", error)
    );
  };

  const NavButton = ({ active, onClick, children, icon: Icon }) => (
    <button
      onClick={onClick}
      className={`flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-3 px-4 py-3 sm:px-6 sm:py-3 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-secondary/10 text-secondary"
          : "text-text-secondary hover:bg-gray-100"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="hidden sm:inline">{children}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-background-default font-sans">
      <header className="bg-gradient-to-r from-primary to-primary-light shadow-lg sticky top-0 z-10 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center gap-4">
              <img
                src="/paleluapp.png"
                alt="Palelu Spa Logo"
                className="h-14 w-14 rounded-full border-2 border-white/50"
              />
              <h1 className="text-2xl font-bold tracking-tight">Palelu Spa</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-white/90 text-right hidden md:block">
                <p>{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <LogOutIcon className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white sm:rounded-lg shadow-md p-2 sm:p-4 mb-8">
          <nav className="flex space-x-2">
            <NavButton
              active={page === "sales"}
              onClick={() => setPage("sales")}
              icon={ShoppingCartIcon}
            >
              Punto de Venta
            </NavButton>
            <NavButton
              active={page === "inventory"}
              onClick={() => setPage("inventory")}
              icon={PackageIcon}
            >
              Gestión Inventario
            </NavButton>
          </nav>
        </div>
        <div>
          {page === "inventory" && <InventoryPage user={user} />}
          {page === "sales" && <SalesPage user={user} />}
        </div>
      </main>
    </div>
  );
};

// --- Componente Principal de la App ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (!auth) {
      setIsAuthReady(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-default">
        <p className="text-primary">Conectando a Palelu Spa...</p>
      </div>
    );
  }

  return (
    <ToastProvider>
      {user ? <AppContent user={user} /> : <LoginPage />}
    </ToastProvider>
  );
}
