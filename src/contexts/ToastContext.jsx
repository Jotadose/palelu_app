import React, { createContext, useContext, useState } from "react";
import { CheckCircleIcon, AlertCircleIcon, XIcon } from "../components/Icons";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return context;
};

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

export const ToastProvider = ({ children }) => {
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
