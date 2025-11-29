import React from "react";
import { XIcon } from "./Icons";

export const Modal = ({ isOpen, onClose, title, children, size = "md", fullScreenMobile = false }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw] sm:max-w-4xl",
  };

  // Clases para fullscreen en móvil
  const mobileFullScreen = fullScreenMobile 
    ? "fixed inset-0 sm:relative sm:inset-auto sm:m-4 sm:rounded-xl rounded-none max-h-full sm:max-h-[90vh]" 
    : "m-4 max-h-[90vh] rounded-xl";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-0 sm:p-4 backdrop-blur-sm">
      <div
        className={`bg-white shadow-xl w-full ${sizeClasses[size]} ${mobileFullScreen} flex flex-col`}
      >
        {/* Header del modal - optimizado para touch */}
        <div className="flex justify-between items-center p-4 border-b bg-white sticky top-0 z-10 safe-area-top">
          <h3 className="text-lg font-semibold text-gray-800 truncate pr-4">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 active:text-gray-800 p-2 -m-2 rounded-full active:bg-gray-100 touch-target"
            aria-label="Cerrar"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 overscroll-contain">{children}</div>
      </div>
    </div>
  );
};

export const StatCard = ({ title, value, icon: Icon, color = "pink" }) => {
  const colorClasses = {
    pink: "bg-pink-100 text-pink-600",
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-md flex items-center">
      <div className={`${colorClasses[color]} p-2 sm:p-3 rounded-full mr-3 sm:mr-4 flex-shrink-0`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
};

export const Button = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  icon: Icon,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] touch-manipulation";

  const variantClasses = {
    primary:
      "bg-primary text-white active:bg-primary-dark focus:ring-primary-light",
    secondary:
      "bg-secondary text-white active:bg-secondary-dark focus:ring-secondary",
    success: "bg-green-600 text-white active:bg-green-700 focus:ring-green-500",
    danger: "bg-red-600 text-white active:bg-red-700 focus:ring-red-500",
    outline:
      "border-2 border-gray-300 text-gray-700 active:bg-gray-100 focus:ring-gray-300",
    ghost: "text-gray-600 active:bg-gray-100 focus:ring-gray-300",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};

export const Badge = ({ children, variant = "default" }) => {
  const variantClasses = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
};

export const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = "" }) => (
  <div className={`px-6 py-4 bg-gray-50 border-b ${className}`}>{children}</div>
);

export const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);
