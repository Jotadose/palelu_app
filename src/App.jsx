import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    onAuthStateChanged
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot,
    doc,
    deleteDoc,
    updateDoc,
    writeBatch,
    query
} from 'firebase/firestore';
import { setLogLevel } from "firebase/firestore";
import { firebaseConfig } from './firebaseConfig';

// --- Íconos (SVGs en línea para simplicidad) ---
const PackageIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"/>
    <path d="M12 14.1c-2.7 0-5.9 1.3-7 2.1.8.5 1.8.9 3 .9H16c1.2 0 2.2-.4 3-.9-1.1-.8-4.3-2.1-7-2.1Z"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
  </svg>
);
const ShoppingCartIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.16"/>
  </svg>
);
const PlusCircleIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);
const Trash2Icon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);
const EditIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
);
const XIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);
const SparklesIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9L12 18l1.9-5.8 5.8-1.9-5.8-1.9L12 3z" />
        <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
);

// --- Configuración de Firebase ---
const appId = firebaseConfig.appId;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
setLogLevel('error');

// --- Helper para la API de Gemini ---
const callGeminiAPI = async (prompt) => {
    // IMPORTANTE: Pega tu clave de API de Google AI Studio aquí.
    const apiKey = "AIzaSyCGxblVpr3bhVbpryhG2HPFF-pUNIwbdOg"; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Error en la respuesta de la API:", response.status, errorBody);
            throw new Error(`Error en la API de Gemini: ${response.status}`);
        }
        const result = await response.json();
        if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            return result.candidates[0].content.parts[0].text;
        } else {
            return "No se pudo obtener una respuesta de la IA.";
        }
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
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><XIcon className="w-6 h-6" /></button>
                </div>
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
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const isEditing = !!productToEdit;

    useEffect(() => {
        if (isEditing) {
            setName(productToEdit.name);
            setSku(productToEdit.sku || '');
            setPrice(productToEdit.price.toString());
            setStock(productToEdit.stock.toString());
            setDescription(productToEdit.description || '');
        }
    }, [isEditing, productToEdit]);

    const handleGenerateDescription = async () => {
        if (!name) { setError('Por favor, introduce un nombre de producto primero.'); return; }
        setIsGenerating(true); setError('');
        try {
            const prompt = `Eres un experto en marketing. Crea una descripción de producto concisa y atractiva (máximo 2-3 frases) para: "${name}".`;
            const generatedDesc = await callGeminiAPI(prompt);
            setDescription(generatedDesc);
        } catch (err) { setError('No se pudo generar la descripción.'); } 
        finally { setIsGenerating(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !price || !stock) { setError('Nombre, precio y stock son campos obligatorios.'); return; }
        setIsLoading(true); setError('');
        try {
            const productData = { name, sku: sku || '', price: parseFloat(price), stock: parseInt(stock, 10), description: description || '' };
            if (isEditing) {
                const productRef = doc(db, `artifacts/${appId}/users/${userId}/products`, productToEdit.id);
                await updateDoc(productRef, productData);
            } else {
                const collectionPath = `artifacts/${appId}/users/${userId}/products`;
                await addDoc(collection(db, collectionPath), { ...productData, createdAt: new Date() });
            }
            onClose();
        } catch (err) {
            console.error("Error guardando producto: ", err);
            setError('No se pudo guardar el producto. Inténtalo de nuevo.');
        } finally { setIsLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="product-name" className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
                <input id="product-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
            <div>
                <label htmlFor="product-description" className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea id="product-description" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                <button type="button" onClick={handleGenerateDescription} disabled={isGenerating || !name} className="mt-2 flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed">
                    <SparklesIcon className="w-4 h-4" />
                    {isGenerating ? 'Generando...' : '✨ Generar Descripción'}
                </button>
            </div>
            <div>
                <label htmlFor="product-sku" className="block text-sm font-medium text-gray-700">SKU (Opcional)</label>
                <input id="product-sku" type="text" value={sku} onChange={(e) => setSku(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="product-price" className="block text-sm font-medium text-gray-700">Precio</label>
                    <input id="product-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="0" step="0.01" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                </div>
                <div>
                    <label htmlFor="product-stock" className="block text-sm font-medium text-gray-700">Stock Inicial</label>
                    <input id="product-stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} min="0" step="1" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">Cancelar</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300">
                    {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Producto' : 'Agregar Producto')}
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
        setIsLoading(true);
        const collectionPath = `artifacts/${appId}/users/${userId}/products`;
        const q = query(collection(db, collectionPath));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            productsData.sort((a, b) => (a.createdAt?.toDate() || 0) - (b.createdAt?.toDate() || 0));
            setProducts(productsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error al obtener productos:", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [userId]);
    
    const openAddModal = () => { setProductToEdit(null); setIsModalOpen(true); };
    const openEditModal = (product) => { setProductToEdit(product); setIsModalOpen(true); };
    const handleDelete = async (productId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            try {
                await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/products`, productId));
            } catch (error) { console.error("Error al eliminar producto:", error); }
        }
    };

    return (
        <div className="p-4 md:p-6">
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={productToEdit ? "Editar Producto" : "Agregar Nuevo Producto"}>
                <ProductForm onClose={() => setIsModalOpen(false)} userId={userId} productToEdit={productToEdit} />
            </Modal>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
                <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700">
                    <PlusCircleIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Agregar Producto</span>
                </button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading ? (<p className="p-6 text-center text-gray-500">Cargando productos...</p>) : 
                     products.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            <h3 className="text-lg font-medium">No hay productos todavía</h3>
                            <p className="mt-1">¡Agrega tu primer producto para empezar!</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Producto</th>
                                    <th scope="col" className="px-6 py-3 hidden md:table-cell">SKU</th>
                                    <th scope="col" className="px-6 py-3">Precio</th>
                                    <th scope="col" className="px-6 py-3">Stock</th>
                                    <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(product => (
                                    <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                                        <td className="px-6 py-4 hidden md:table-cell">{product.sku || 'N/A'}</td>
                                        <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                                        <td className={`px-6 py-4 font-semibold ${product.stock <= 5 ? 'text-red-500' : 'text-green-600'}`}>{product.stock}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <button onClick={() => openEditModal(product)} className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full"><EditIcon className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(product.id)} className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full"><Trash2Icon className="w-4 h-4" /></button>
                                            </div>
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

const SalesForm = ({ userId, products, onClose }) => {
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const product = products.find(p => p.id === selectedProduct);
        if (!product || quantity <= 0 || quantity > product.stock) { setError('Selección o cantidad inválida.'); return; }
        setIsLoading(true); setError('');
        try {
            const batch = writeBatch(db);
            const saleRef = doc(collection(db, `artifacts/${appId}/users/${userId}/sales`));
            batch.set(saleRef, {
                productId: product.id, productName: product.name, quantity: Number(quantity),
                pricePerUnit: product.price, totalPrice: product.price * quantity, saleDate: new Date(),
            });
            const productRef = doc(db, `artifacts/${appId}/users/${userId}/products`, product.id);
            batch.update(productRef, { stock: product.stock - Number(quantity) });
            await batch.commit();
            onClose();
        } catch (err) {
            console.error("Error al registrar la venta: ", err);
            setError('No se pudo registrar la venta.');
        } finally { setIsLoading(false); }
    };
    const product = products.find(p => p.id === selectedProduct);
    const totalPrice = product ? (product.price * quantity).toFixed(2) : '0.00';

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="sale-product" className="block text-sm font-medium text-gray-700">Producto</label>
                <select id="sale-product" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" required>
                    <option value="" disabled>Selecciona un producto</option>
                    {products.filter(p => p.stock > 0).map(p => (<option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>))}
                </select>
            </div>
             <div>
                <label htmlFor="sale-quantity" className="block text-sm font-medium text-gray-700">Cantidad</label>
                <input id="sale-quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" max={product ? product.stock : undefined} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
            <div className="text-right"><p className="text-lg font-semibold text-gray-800">Total: <span className="text-indigo-600">${totalPrice}</span></p></div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">Cancelar</button>
                <button type="submit" disabled={isLoading || !selectedProduct} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300">
                    {isLoading ? 'Registrando...' : 'Registrar Venta'}
                </button>
            </div>
        </form>
    );
};

const SalesPage = ({ userId }) => {
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        if (!userId) return;
        setIsLoading(true);
        const salesQuery = query(collection(db, `artifacts/${appId}/users/${userId}/sales`));
        const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
            const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            salesData.sort((a, b) => b.saleDate.toDate() - a.saleDate.toDate());
            setSales(salesData);
            if (isLoading) setIsLoading(false);
        });
        const productsQuery = query(collection(db, `artifacts/${appId}/users/${userId}/products`));
        const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => { unsubscribeSales(); unsubscribeProducts(); };
    }, [userId]);

    const handleAnalyzeSales = async () => {
        setIsAnalysisModalOpen(true); setIsAnalyzing(true); setAnalysisResult('');
        try {
            const salesDataString = sales.map(s => `Producto: ${s.productName}, Cantidad: ${s.quantity}, Total: $${s.totalPrice.toFixed(2)}`).join('\n');
            const prompt = `Eres un analista de negocios experto. Analiza los siguientes datos de ventas. Proporciona un resumen claro en Markdown. Incluye:
1. **Resumen General:** Ingresos totales y número total de ventas.
2. **Producto Estrella:** Identifica el producto más vendido y el que más ingresos generó.
3. **Recomendación Práctica:** Un consejo accionable para el dueño.
Datos de Ventas:\n${salesDataString}`;
            const result = await callGeminiAPI(prompt);
            setAnalysisResult(result);
        } catch (err) { setAnalysisResult('Hubo un error al analizar las ventas.');
        } finally { setIsAnalyzing(false); }
    };

    return (
        <div className="p-4 md:p-6">
            <Modal isOpen={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} title="Registrar Nueva Venta">
                <SalesForm userId={userId} products={products} onClose={() => setIsSaleModalOpen(false)} />
            </Modal>
            <Modal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} title="✨ Análisis de Ventas con IA">
                {isAnalyzing ? (<div className="text-center p-8"><p className="text-gray-600">Analizando...</p></div>) : 
                (<div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: analysisResult.replace(/\n/g, '<br />') }}></div>)}
            </Modal>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Ventas</h1>
                <div className="flex gap-2">
                    <button onClick={handleAnalyzeSales} disabled={sales.length === 0} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg shadow-sm hover:bg-indigo-200 disabled:bg-gray-100 disabled:text-gray-500">
                        <SparklesIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">✨ Analizar Ventas</span>
                    </button>
                    <button onClick={() => setIsSaleModalOpen(true)} disabled={products.filter(p => p.stock > 0).length === 0} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed">
                        <PlusCircleIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Nueva Venta</span>
                    </button>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading ? (<p className="p-6 text-center text-gray-500">Cargando ventas...</p>) : 
                     sales.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            <h3 className="text-lg font-medium">No hay ventas registradas</h3>
                            <p className="mt-1">Realiza tu primera venta para verla aquí.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Producto</th>
                                    <th scope="col" className="px-6 py-3 hidden sm:table-cell">Fecha</th>
                                    <th scope="col" className="px-6 py-3">Cantidad</th>
                                    <th scope="col" className="px-6 py-3">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map(sale => (
                                    <tr key={sale.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{sale.productName}</td>
                                        <td className="px-6 py-4 hidden sm:table-cell">{new Date(sale.saleDate.seconds * 1000).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">{sale.quantity}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-800">${sale.totalPrice.toFixed(2)}</td>
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
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                signInAnonymously(auth).catch(error => console.error("Error en el inicio de sesión anónimo final:", error));
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    const NavButton = ({ active, onClick, children, icon: Icon }) => (
        <button onClick={onClick} className={`flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-3 px-4 py-3 sm:px-6 sm:py-3 rounded-lg text-sm font-medium transition-colors ${ active ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100' }`}>
            <Icon className="w-5 h-5" />
            <span className="hidden sm:inline">{children}</span>
        </button>
    );

    if (!isAuthReady) {
        return (<div className="flex items-center justify-center h-screen bg-gray-50"><p className="text-gray-600">Cargando aplicación...</p></div>);
    }
    
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <style>{`.prose br { display: block; content: ""; margin-top: 0.5em; }`}</style>
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-3">
                        <div className="flex items-center gap-2">
                           <div className="bg-indigo-600 p-2 rounded-lg"><PackageIcon className="w-6 h-6 text-white" /></div>
                           <h1 className="text-xl font-bold text-gray-800 hidden sm:block">Gestor Fácil con IA</h1>
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
