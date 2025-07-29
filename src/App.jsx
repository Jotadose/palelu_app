import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc, writeBatch, query } from 'firebase/firestore';
import { setLogLevel } from "firebase/firestore";

// --- Configuración de Firebase (leída desde variables de entorno en Vercel) ---
// Para desarrollo local, crea un archivo 'firebaseConfig.js' y descomenta la siguiente línea:
// import { firebaseConfig } from './firebaseConfig'; 

// --- Íconos Temáticos ---
const PizzaIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 11h.01"/><path d="M11 15h.01"/><path d="M16 16h.01"/><path d="m2 16 2.24 1.12a2 2 0 0 0 1.52-.22L8 15.5l.9 2.4c.27.73 1.1.98 1.8.7l5.4-2.02c.56-.21.9-.76.9-1.38V4.4c0-.55-.34-1.05-.85-1.25L12 2 4.15 3.15c-.5.2-.85.7-.85 1.25v10.2c0 .4.2.78.53.98Z"/></svg>;
const ShoppingCartIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.16"/></svg>;
const PlusCircleIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>;
const Trash2Icon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
const EditIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>;
const XIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const SparklesIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9L12 18l1.9-5.8 5.8-1.9-5.8-1.9L12 3z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>;
const PackageIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v2"/><path d="M21 14v2a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16v-2"/><path d="M3 10v4"/><path d="M21 10v4"/><path d="M12 22V12"/><path d="m7 12-5-2.5"/><path d="m17 12 5-2.5"/></svg>;

// --- Inicialización de Firebase ---
let app, auth, db, appId;
try {
    // Para desarrollo local, descomenta la siguiente línea y comenta la de Vercel
    // const firebaseConfig = (await import('./firebaseConfig')).firebaseConfig;
    
    // Para Vercel
    const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);
    
    appId = firebaseConfig.appId;
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    setLogLevel('error');
} catch (error) {
    console.error("Error al inicializar Firebase. Asegúrate de que las variables de entorno están configuradas.", error);
}

// --- Helper para la API de Gemini ---
const callGeminiAPI = async (prompt) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) { console.error("La clave de API de Gemini no está configurada."); return "Error: API Key no configurada."; }
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`Error en la API de Gemini: ${response.status}`);
        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo obtener una respuesta de la IA.";
    } catch (error) {
        console.error("Error al llamar a la API de Gemini:", error);
        throw error;
    }
};

// --- Componentes de la UI ---
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 max-h-[90vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-scale-in">
                <div className="flex justify-between items-center p-4 border-b"><h3 className="text-lg font-semibold text-gray-800">{title}</h3><button onClick={onClose} className="text-gray-500 hover:text-gray-800"><XIcon className="w-6 h-6" /></button></div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

const ProductForm = ({ onClose, userId, productToEdit }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [category, setCategory] = useState('Bebestible');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!productToEdit;

    const categories = ["🥤 Bebestible", " 🥖 Chaparrita", "🥟 Empanada", "🍕 Pizza", "🍬 Dulce", "🍟 Papas Fritas", "🥙 Snack Saludable", "🥓 Snack No Saludable", "🍪 Otro"];

    useEffect(() => {
        if (isEditing) {
            setName(productToEdit.name);
            setPrice(productToEdit.price.toString());
            setStock(productToEdit.stock.toString());
            setCategory(productToEdit.category || 'Otro');
        }
    }, [isEditing, productToEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !price || !stock) { setError('Nombre, precio y stock son obligatorios.'); return; }
        setIsLoading(true); setError('');
        try {
            const productData = { name, price: parseFloat(price), stock: parseInt(stock, 10), category };
            if (isEditing) {
                await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/products`, productToEdit.id), productData);
            } else {
                await addDoc(collection(db, `artifacts/${appId}/users/${userId}/products`), { ...productData, createdAt: new Date() });
            }
            onClose();
        } catch (err) {
            console.error("Error guardando producto: ", err);
            setError('No se pudo guardar el producto.');
        } finally { setIsLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="product-name" className="block text-sm font-medium text-gray-700">✍️ Nombre del Producto</label>
                <input id="product-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500" required />
            </div>
            <div>
                <label htmlFor="product-category" className="block text-sm font-medium text-gray-700">🗃️ Categoría</label>
                <select id="product-category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-md">
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="product-price" className="block text-sm font-medium text-gray-700">💸 Precio</label>
                    <input id="product-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="0" step="0.01" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500" required />
                </div>
                <div>
                    <label htmlFor="product-stock" className="block text-sm font-medium text-gray-700">📦 Stock</label>
                    <input id="product-stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} min="0" step="1" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500" required />
                </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">Cancelar</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md shadow-sm hover:bg-pink-700 disabled:bg-pink-300">
                    {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Agregar')}
                </button>
            </div>
        </form>
    );
};

const InventoryPage = ({ userId }) => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);

    useEffect(() => {
        if (!userId || !db) return;
        const q = query(collection(db, `artifacts/${appId}/users/${userId}/products`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(productsData);
            setIsLoading(false);
        }, (error) => { console.error("Error al obtener productos:", error); setIsLoading(false); });
        return () => unsubscribe();
    }, [userId]);
    
    const groupedProducts = useMemo(() => {
        if (products.length === 0) return {};
        return products.reduce((acc, product) => {
            const category = product.category || 'Sin Categoría';
            if (!acc[category]) acc[category] = [];
            acc[category].push(product);
            return acc;
        }, {});
    }, [products]);

    const openAddModal = () => { setProductToEdit(null); setIsModalOpen(true); };
    const openEditModal = (product) => { setProductToEdit(product); setIsModalOpen(true); };
    const handleDelete = async (productId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            try { await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/products`, productId)); } 
            catch (error) { console.error("Error al eliminar producto:", error); }
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={productToEdit ? "Editar Producto" : "Agregar Nuevo Producto"}>
                <ProductForm onClose={() => setIsModalOpen(false)} userId={userId} productToEdit={productToEdit} />
            </Modal>
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Inventario</h1>
                <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-full shadow-lg hover:bg-pink-700 transition-all transform hover:scale-105">
                    <PlusCircleIcon className="w-5 h-5" />
                    <span>Agregar Producto</span>
                </button>
            </div>
            {isLoading ? (<p className="text-center text-gray-500 py-10">Cargando inventario...</p>) : 
             Object.keys(groupedProducts).length === 0 ? (
                <div className="text-center py-16 px-4 bg-white rounded-lg shadow-md">
                    <h3 className="text-xl font-medium text-gray-700">Tu inventario está vacío </h3>
                    <p className="mt-2 text-gray-500">¡Agrega tu primer producto para empezar a vender!</p>
                </div>
            ) : (
                Object.keys(groupedProducts).sort().map(category => (
                    <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
                        <h2 className="px-6 py-4 bg-pink-50 text-pink-800 font-bold text-md">{category}</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <tbody>
                                    {groupedProducts[category].map((product, index) => (
                                        <tr key={product.id} className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-pink-50/50`}>
                                            <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                                            <td className="px-6 py-4 text-gray-600">${product.price.toFixed(2)}</td>
                                            <td className={`px-6 py-4 font-semibold text-right ${product.stock <= 5 ? 'text-red-500' : 'text-green-600'}`}>{product.stock} <span className="text-xs text-gray-400">unid.</span></td>
                                            <td className="px-6 py-4 w-28">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button onClick={() => openEditModal(product)} className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-100 rounded-full transition-colors"><EditIcon className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"><Trash2Icon className="w-4 h-4" /></button>
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

const SalesPage = ({ userId }) => {
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    
    const totalSalesValue = useMemo(() => sales.reduce((sum, sale) => sum + sale.totalPrice, 0), [sales]);

    useEffect(() => {
        if (!userId || !db) return;
        const salesQuery = query(collection(db, `artifacts/${appId}/users/${userId}/sales`));
        const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
            const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            salesData.sort((a, b) => b.saleDate.toDate() - a.saleDate.toDate());
            setSales(salesData);
            setIsLoading(false);
        });
        const productsQuery = query(collection(db, `artifacts/${appId}/users/${userId}/products`));
        const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => { unsubscribeSales(); unsubscribeProducts(); };
    }, [userId]);

    return (
        <div className="p-4 md:p-6 space-y-6">
            <Modal isOpen={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} title="Registrar Nueva Venta">
                <SalesForm userId={userId} products={products} onClose={() => setIsSaleModalOpen(false)} />
            </Modal>
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Ventas</h1>
                 <button onClick={() => setIsSaleModalOpen(true)} disabled={products.filter(p => p.stock > 0).length === 0} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-full shadow-lg hover:bg-pink-700 disabled:bg-pink-300 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                    <PlusCircleIcon className="w-5 h-5" />
                    <span>Nueva Venta</span>
                </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="text-md font-medium text-gray-500">Total Recaudado</h3>
                <p className="mt-1 text-4xl font-bold text-pink-600">${totalSalesValue.toFixed(2)}</p>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                 <h2 className="px-6 py-4 bg-pink-50 text-pink-800 font-bold text-md">Historial de Ventas</h2>
                <div className="overflow-x-auto">
                    {isLoading ? (<p className="p-6 text-center text-gray-500">Cargando ventas...</p>) : 
                     sales.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <h3 className="text-lg font-medium">No hay ventas registradas</h3>
                            <p className="mt-1">¡Realiza tu primera venta para verla aquí!</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <tbody>
                                {sales.map((sale, index) => (
                                    <tr key={sale.id} className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-pink-50/50`}>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {sale.productName}
                                            <span className="ml-2 text-gray-400">x{sale.quantity}</span>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell text-gray-500 text-right">{new Date(sale.saleDate.seconds * 1000).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-800 text-right">${sale.totalPrice.toFixed(2)}</td>
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

// --- Componente Principal de la App ---
export default function App() {
    const [page, setPage] = useState('inventory');
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                signInAnonymously(auth).catch(error => console.error("Error en el inicio de sesión anónimo:", error));
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    const NavButton = ({ active, onClick, children, icon: Icon }) => (
        <button onClick={onClick} className={`flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-3 px-4 py-3 sm:px-6 sm:py-3 rounded-lg text-sm font-medium transition-colors ${ active ? 'bg-pink-100 text-pink-700' : 'text-gray-600 hover:bg-gray-100' }`}>
            <Icon className="w-5 h-5" />
            <span className="hidden sm:inline">{children}</span>
        </button>
    );

    if (!auth) {
        return (<div className="flex items-center justify-center h-screen bg-pink-50 p-4 text-center"><p className="text-red-600 font-semibold">Error de Configuración: No se pudo inicializar Firebase. Revisa las variables de entorno en Vercel.</p></div>);
    }
    if (!isAuthReady) {
        return (<div className="flex items-center justify-center h-screen bg-pink-50"><p className="text-pink-700">Conectando a Palelu Spa...</p></div>);
    }
    
    return (
        <div className="min-h-screen bg-pink-50/50 font-sans">
            <style>{`
                @keyframes scale-in {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
            `}</style>
                <header className="bg-gradient-to-r from-pink-600 to-rose-500 shadow-lg sticky top-0 z-10 text-white">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-3">
                            {/* --- Lado Izquierdo: Logo y Título --- */}
                            <div className="flex items-center gap-4">
                                <img src="src\assets\img\paleluapp.png" alt="Palelu Spa Logo" className="h-12 w-12 rounded-full" />
                                
                                <h1 className="text-2xl font-bold tracking-tight">Palelu Spa</h1>
                            </div>

                            {/* --- Lado Derecho: ID de Vendedor --- */}
                            <div className="text-xs text-white/80 text-right">
                                <p>ID de Vendedor:</p>
                                <p className="font-mono break-all text-white">{userId}</p>
                            </div>
                        </div>
                    </div>
                </header>
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white sm:rounded-lg shadow-md p-2 sm:p-4 mb-8">
                    <nav className="flex space-x-2">
                        <NavButton active={page === 'inventory'} onClick={() => setPage('inventory')} icon={PackageIcon}>Inventario</NavButton>
                        <NavButton active={page === 'sales'} onClick={() => setPage('sales')} icon={ShoppingCartIcon}>Ventas</NavButton>
                    </nav>
                </div>
                <div>
                    {page === 'inventory' && <InventoryPage userId={userId} />}
                    {page === 'sales' && <SalesPage userId={userId} />}
                </div>
            </main>
            <footer className="text-center py-6">
                <p className="text-xs text-pink-900/50">Palelu App v1.0</p>
            </footer>
        </div>
    );
}
