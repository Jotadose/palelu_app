import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { Modal, Button, Badge, Card, CardHeader } from "../components/UI";
import {
  UsersIcon,
  UserIcon,
  EditIcon,
  LockIcon,
} from "../components/Icons";

// Modal de edición de usuario
const EditUserModal = ({ isOpen, onClose, user, onSave, appId, db }) => {
  const [role, setRole] = useState(user?.role || "vendedor");
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (user) {
      setRole(user.role || "vendedor");
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userRef = doc(db, `artifacts/${appId}/public/data/users`, user.id);
      await updateDoc(userRef, { role });
      showToast("Usuario actualizado");
      onClose();
    } catch (error) {
      console.error("Error actualizando usuario:", error);
      showToast("Error al actualizar usuario", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Usuario">
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <p className="text-gray-900 font-medium">{user.email}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rol
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="vendedor">Vendedor</option>
            <option value="admin">Administrador</option>
          </select>
          <p className="text-xs text-gray-500 mt-2">
            {role === "admin"
              ? "Puede acceder a todas las funciones: ventas, inventario, caja y configuración."
              : "Solo puede acceder al punto de venta."}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export const UsersPage = ({ app, appId }) => {
  const { user: currentUser, isAdmin } = useAuth();
  const { showToast } = useToast();
  const db = getFirestore(app);

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const q = query(collection(db, `artifacts/${appId}/public/data/users`));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error al obtener usuarios:", error);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [db, appId]);

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <LockIcon className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Acceso Denegado</h2>
        <p className="text-gray-600">
          No tienes permisos para ver esta página.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        appId={appId}
        db={db}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Usuarios</h1>
          <p className="text-gray-600">
            Administra los roles y permisos de los usuarios
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-gray-500" />
            <span className="font-bold">Usuarios Registrados ({users.length})</span>
          </div>
        </CardHeader>

        {isLoading ? (
          <div className="p-6 text-center text-gray-500">
            Cargando usuarios...
          </div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay usuarios registrados
          </div>
        ) : (
          <div className="divide-y">
            {users.map((user) => (
              <div
                key={user.id}
                className="px-6 py-4 flex justify-between items-center hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <UserIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.email}</p>
                    <p className="text-sm text-gray-500">
                      Registrado:{" "}
                      {user.createdAt?.toDate?.().toLocaleDateString("es-CL") ||
                        "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant={user.role === "admin" ? "info" : "default"}
                  >
                    {user.role === "admin" ? "👑 Admin" : "🛒 Vendedor"}
                  </Badge>
                  {user.id !== currentUser?.uid && (
                    <button
                      onClick={() => setEditingUser(user)}
                      className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-bold text-blue-800 mb-2">Sobre los Roles</h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p>
            <strong>👑 Administrador:</strong> Acceso completo. Puede gestionar
            ventas, inventario, caja, usuarios y configuración.
          </p>
          <p>
            <strong>🛒 Vendedor:</strong> Solo puede acceder al punto de venta
            y ver el resumen del día.
          </p>
        </div>
      </div>
    </div>
  );
};
