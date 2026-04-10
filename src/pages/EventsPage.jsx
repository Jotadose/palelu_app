import React, { useState } from "react";
import { useEvent } from "../contexts/EventContext";
import { EventCreateModal } from "../components/EventCreateModal";
import { EventCloseModal } from "../components/EventCloseModal";
import { Modal, Button, StatCard } from "../components/UI";
import { useToast } from "../contexts/ToastContext";
import {
  PlusCircleIcon,
  CalendarIcon,
  PackageIcon,
  CheckCircleIcon,
  XCircleIcon,
  LockIcon,
  UnlockIcon,
} from "../components/Icons";

export const EventsPage = ({ app, appId }) => {
  const { showToast } = useToast();
  const {
    currentEvent,
    events,
    eventInventory,
    getMasterProducts,
    createEvent,
    closeEvent,
  } = useEvent();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const openEvents = events.filter((e) => e.status === "open");
  const closedEvents = events.filter((e) => e.status === "closed");

  const handleCreateEvent = async (name, date, importFromMaster, selectedProducts) => {
    await createEvent(name, date, importFromMaster, selectedProducts);
  };

  const handleCloseEvent = async (eventId, decisions) => {
    await closeEvent(eventId, decisions);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Calcular stats de un evento
  const getEventStats = (event) => {
    if (event.status === "closed") {
      return {
        ventas: event.totals?.ventasTotales || 0,
        productosVendidos: event.productsSold || 0,
      };
    }
    return { ventas: 0, productosVendidos: 0 };
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-safe">
      {/* Modales */}
      <EventCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateEvent}
        getMasterProducts={getMasterProducts}
      />

      <EventCloseModal
        isOpen={showCloseModal}
        onClose={() => {
          setShowCloseModal(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        eventInventory={eventInventory}
        onCloseEvent={handleCloseEvent}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">🎉 Eventos</h1>
          <p className="text-text-secondary text-sm sm:text-base">
            Gestión de eventos con inventario aislado
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={currentEvent !== null}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 sm:py-3 text-white text-lg sm:text-base rounded-xl shadow-lg active:scale-[0.98] transition-all font-bold touch-target ${
            currentEvent !== null
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-pink-600 active:bg-pink-700"
          }`}
        >
          <PlusCircleIcon className="w-6 h-6" />
          <span>Nuevo Evento</span>
        </button>
      </div>

      {/* Evento activo */}
      {currentEvent && (
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                  🔴 Evento Activo
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">{currentEvent.name}</h2>
              <p className="text-sm opacity-90 mt-1">
                📅 {currentEvent.date}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedEvent(currentEvent);
                setShowCloseModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
            >
              <LockIcon className="w-4 h-4" />
              Cerrar
            </button>
          </div>
          
          {/* Stats rápidos */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{eventInventory.length}</p>
              <p className="text-xs opacity-80">Productos</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">
                {eventInventory.reduce((sum, p) => sum + (p.stock || 0), 0)}
              </p>
              <p className="text-xs opacity-80">Stock Total</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">
                {eventInventory.reduce((sum, p) => sum + (p.sold || 0), 0)}
              </p>
              <p className="text-xs opacity-80">Vendidos</p>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje si no hay evento activo */}
      {!currentEvent && events.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <CalendarIcon className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="font-medium text-yellow-800">No hay evento activo</p>
            <p className="text-sm text-yellow-600">Crea un nuevo evento para comenzar</p>
          </div>
        </div>
      )}

      {/* Lista de eventos abiertos */}
      {openEvents.length > 0 && currentEvent && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-4 sm:px-6 py-3 bg-green-50 border-b flex items-center gap-2">
            <UnlockIcon className="w-5 h-5 text-green-600" />
            <h2 className="font-bold text-green-800">Eventos Abiertos ({openEvents.length})</h2>
          </div>
          <div className="divide-y">
            {openEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 active:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800">{event.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <CalendarIcon className="w-4 h-4" />
                      {event.date}
                    </p>
                  </div>
                  {event.id === currentEvent?.id && (
                    <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                      Activo
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de eventos cerrados */}
      {closedEvents.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b flex items-center gap-2">
            <LockIcon className="w-5 h-5 text-gray-600" />
            <h2 className="font-bold text-gray-700">Eventos Cerrados ({closedEvents.length})</h2>
          </div>
          <div className="divide-y">
            {closedEvents.map((event) => {
              const stats = getEventStats(event);
              return (
                <div
                  key={event.id}
                  className="p-4 active:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800">{event.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <CalendarIcon className="w-4 h-4" />
                        {event.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">
                        ${stats.ventas.toLocaleString("es-CL")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {stats.productosVendidos} vendidos
                      </p>
                    </div>
                  </div>
                  {event.closedAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      Cerrado: {formatDate(event.closedAt)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {events.length === 0 && (
        <div className="text-center py-16 px-4 bg-white rounded-xl shadow-md">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-8 h-8 text-pink-500" />
          </div>
          <h3 className="text-xl font-medium text-gray-700">
            No hay eventos todavía
          </h3>
          <p className="mt-2 text-gray-500">
            ¡Crea tu primer evento para gestionar el inventario!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-6 py-3 bg-pink-600 text-white rounded-xl font-medium active:bg-pink-700"
          >
            Crear Primer Evento
          </button>
        </div>
      )}
    </div>
  );
};