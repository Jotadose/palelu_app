import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { PizzaIcon } from "../components/Icons";

export const LoginPage = () => {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError("");
    try {
      await login(email, password);
    } catch (err) {
      setLocalError("Correo o contraseña incorrectos.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-default p-4 safe-area-inset">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 bg-white rounded-2xl shadow-lg">
        <div className="text-center">
          <div className="inline-block bg-primary p-4 rounded-2xl shadow-md">
            <PizzaIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-text-primary">
            Palelu Spa
          </h1>
          <p className="text-text-secondary">Punto de Venta</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
          <div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-4 text-base border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary touch-target"
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
              className="w-full px-4 py-4 text-base border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary touch-target"
              placeholder="Contraseña"
            />
          </div>
          {(error || localError) && (
            <p className="text-sm text-center text-red-500 bg-red-50 py-2 px-4 rounded-lg">
              {error || localError}
            </p>
          )}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-primary active:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:bg-primary-light/50 touch-target active:scale-[0.98] transition-transform"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Ingresando...
                </span>
              ) : "Ingresar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
