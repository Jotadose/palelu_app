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
const DrinkIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M15 9l-2 3h4l-2 3"/></svg>;
const SnackIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 11h20"/><path d="M11 11a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1Z"/><path d="M17 11v2.34a2 2 0 0 1-.3 1.06L15.17 17H8.83l-1.57-2.6a2 2 0 0 1-.3-1.06V11"/><path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/></svg>;

// --- Inicialización de Firebase ---
let app, auth, db, appId;
try {
    const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);
    appId = firebaseConfig.appId;
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    setLogLevel('error');
} catch (error) {
    console.error("Error al inicializar Firebase. Asegúrate de que las variables de entorno están configuradas en Vercel.", error);
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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b"><h3 className="text-lg font-semibold text-gray-800">{title}</h3><button onClick={onClose} className="text-gray-500 hover:text-gray-800"><XIcon className="w-6 h-6" /></button></div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

const ProductForm = ({ onClose, userId, productToEdit }) => {
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [category, setCategory] = useState('Bebestible');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const isEditing = !!productToEdit;

    const categories = ["Bebestible", "Chaparrita", "Empanada", "Pizza", "Dulce", "Papas Fritas", "Snack Saludable", "Snack No Saludable", "Otro"];

    useEffect(() => {
        if (isEditing) {
            setName(productToEdit.name);
            setSku(productToEdit.sku || '');
            setPrice(productToEdit.price.toString());
            setStock(productToEdit.stock.toString());
            setCategory(productToEdit.category || 'Otro');
            setDescription(productToEdit.description || '');
        }
    }, [isEditing, productToEdit]);

    const handleGenerateDescription = async () => {
        if (!name) { setError('Por favor, introduce un nombre de producto primero.'); return; }
        setIsGenerating(true); setError('');
        try {
            const prompt = `Crea una descripción de marketing muy corta y vendedora (máximo 10 palabras) para un producto llamado "${name}" que se vende en un estadio. Debe ser apetitosa y directa.`;
            const generatedDesc = await callGeminiAPI(prompt);
            setDescription(generatedDesc);
        } catch (err) { setError('No se pudo generar la descripción.'); } 
        finally { setIsGenerating(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !price || !stock) { setError('Nombre, precio y stock son obligatorios.'); return; }
        setIsLoading(true); setError('');
        try {
            const productData = { name, sku: sku || '', price: parseFloat(price), stock: parseInt(stock, 10), category, description: description || '' };
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
                <label htmlFor="product-name" className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
                <input id="product-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500" required />
            </div>
            <div>
                <label htmlFor="product-category" className="block text-sm font-medium text-gray-700">Categoría</label>
                <select id="product-category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-md">
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="product-description" className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea id="product-description" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"></textarea>
                <button type="button" onClick={handleGenerateDescription} disabled={isGenerating || !name} className="mt-2 flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-pink-700 bg-pink-100 rounded-md hover:bg-pink-200 disabled:bg-gray-100">
                    <SparklesIcon className="w-4 h-4" />
                    {isGenerating ? 'Generando...' : '✨ Generar Descripción'}
                </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="product-price" className="block text-sm font-medium text-gray-700">Precio</label>
                    <input id="product-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="0" step="0.01" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500" required />
                </div>
                <div>
                    <label htmlFor="product-stock" className="block text-sm font-medium text-gray-700">Stock</label>
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
        if (!userId) return;
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
                <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
                <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-lg shadow-sm hover:bg-pink-700 transition-colors">
                    <PlusCircleIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Agregar Producto</span>
                </button>
            </div>
            {isLoading ? (<p className="text-center text-gray-500 py-10">Cargando inventario...</p>) : 
             Object.keys(groupedProducts).length === 0 ? (
                <div className="text-center py-10 px-4 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-700">Tu inventario está vacío</h3>
                    <p className="mt-1 text-gray-500">¡Agrega tu primer producto para empezar a vender!</p>
                </div>
            ) : (
                Object.keys(groupedProducts).sort().map(category => (
                    <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
                        <h2 className="px-6 py-3 bg-pink-50 text-pink-800 font-bold text-sm uppercase">{category}</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-600">
                                <thead className="bg-gray-50 text-xs text-gray-700 uppercase sr-only">
                                    <tr><th>Producto</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr>
                                </thead>
                                <tbody>
                                    {groupedProducts[category].map(product => (
                                        <tr key={product.id} className="border-b hover:bg-pink-50/50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                                            <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                                            <td className={`px-6 py-4 font-semibold ${product.stock <= 5 ? 'text-red-500' : 'text-green-600'}`}>{product.stock}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button onClick={() => openEditModal(product)} className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-100 rounded-full"><EditIcon className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full"><Trash2Icon className="w-4 h-4" /></button>
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
        if (!userId) return;
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
                <h1 className="text-2xl font-bold text-gray-800">Ventas</h1>
                <button onClick={() => setIsSaleModalOpen(true)} disabled={products.filter(p => p.stock > 0).length === 0} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-lg shadow-sm hover:bg-pink-700 disabled:bg-pink-300 disabled:cursor-not-allowed transition-colors">
                    <PlusCircleIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Nueva Venta</span>
                </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total de Ventas</h3>
                <p className="mt-1 text-3xl font-semibold text-pink-600">${totalSalesValue.toFixed(2)}</p>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                 <h2 className="px-6 py-3 bg-pink-50 text-pink-800 font-bold text-sm uppercase">Historial de Ventas</h2>
                <div className="overflow-x-auto">
                    {isLoading ? (<p className="p-6 text-center text-gray-500">Cargando ventas...</p>) : 
                     sales.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            <h3 className="text-lg font-medium">No hay ventas registradas</h3>
                            <p className="mt-1">¡Realiza tu primera venta para verla aquí!</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="bg-gray-50 text-xs text-gray-700 uppercase sr-only">
                                <tr><th>Producto</th><th>Fecha</th><th>Cantidad</th><th>Total</th></tr>
                            </thead>
                            <tbody>
                                {sales.map(sale => (
                                    <tr key={sale.id} className="border-b hover:bg-pink-50/50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{sale.productName}</td>
                                        <td className="px-6 py-4 hidden sm:table-cell text-gray-500">{new Date(sale.saleDate.seconds * 1000).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-center">{sale.quantity}</td>
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
        return (<div className="flex items-center justify-center h-screen bg-gray-50 p-4 text-center"><p className="text-red-600 font-semibold">Error de Configuración: No se pudo inicializar Firebase. Revisa las variables de entorno en Vercel.</p></div>);
    }
    if (!isAuthReady) {
        return (<div className="flex items-center justify-center h-screen bg-gray-50"><p className="text-gray-600">Conectando de forma segura...</p></div>);
    }
    
    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-3">
                        <div className="flex items-center gap-3">
                           <div className="bg-pink-600 p-2 rounded-lg shadow"><PizzaIcon className="w-6 h-6 text-white" /></div>
                           <h1 className="text-xl font-bold text-gray-800 hidden sm:block">Palelu Spa - Punto de Venta</h1>
                        </div>
                         <div className="text-xs text-gray-500 text-right">
                           <p>ID de Sesión:</p>
                           <p className="font-mono break-all">{userId}</p>
                        </div>
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-4">
                <div className="bg-white sm:rounded-lg shadow-md p-2 sm:p-4 mb-6">
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
            <footer className="text-center py-4 mt-8">
                <p className="text-xs text-gray-500">Potenciado con IA de Gemini. Creado para una gestión simple.</p>
            </footer>
        </div>
    );
}
