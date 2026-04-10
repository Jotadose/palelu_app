# Proposal: Sistema de Inventario por Eventos

## Intent

El comerciante vende en estadios y necesita separar el inventario por cada evento/partido. Actualmente existe un único inventario compartido que no permite gestionar stock específico por evento. El problema es que al terminar un partido no se puede determinar qué productos sobraron específicos de ese evento, ni separar ventas por evento.

## Scope

### In Scope
- **Inventario Maestro**: Catálogo de productos disponibles (el stock general/del almacén)
- **Gestión de Eventos**: Crear, cerrar, listar eventos con nombre + fecha
- **Importar inventario al crear evento**: Seleccionar productos del maestro y definir cantidades a llevar
- **Inventario aislado por evento**: Cada evento tiene su propio stock, independiente del maestro
- **Lógica de ventas**: Si hay evento activo → usar inventario del evento; si no → usar inventario maestro
- **Cierre de evento**: Seleccionar productos a eliminar (no volvieron) y cuáles reintegrar al maestro
- **Reportes por evento**: ventas, precios, márgenes, ganancias, IVA, porcentaje de posición
- **Indicador visual de evento activo** en terminal de ventas

### Out of Scope
- Merma por evento (se maneja en cierre)
- Traslados entre eventos
- Historial de precios por evento (precios fijos del maestro)

## Capabilities

### New Capabilities
- `master-inventory`: Catálogo maestro de productos (inventario general/del almacén)
- `event-management`: CRUD de eventos con estado (activo/cerrado)
- `event-inventory`: Stock aislado por evento, importado del maestro
- `event-sales-logic`: Lógica de ventas que determina qué inventario usar
- `event-closure`: Proceso de cierre con selección de productos a reintegrar/eliminar
- `event-reports`: Reportes específicos por evento (ventas, ganancias, métricas)

### Modified Capabilities
- `sales`: Añadir `eventId` a cada orden para traceability
- `inventory`: Separar en maestro vs. inventario por evento

## Approach

### Arquitectura de Datos (Firebase Firestore)

```
artifacts/{appId}/public/data/
├── products/                    ← INVENTARIO MAESTRO (catálogo)
│   └── {productId}: { name, price, category, imageUrl, ... }
├── events/
│   └── {eventId}: { name, date, status, createdAt, closedAt }
└── eventInventories/
    └── {eventId}/
        └── {productId}: { quantity: n }  ← Stock por evento
```

### Flujo de Creación de Evento
1. Formulario: nombre + fecha del evento
2. Selector: "Importar del maestro" o "Empezar de cero"
3. Si importar: lista productos maestro con input de cantidad a llevar
4. Crear documento en `events/` + subcolección `eventInventories/`

### Flujo de Ventas
- Consultar `events` para evento activo (`status: "active"`)
- Si existe evento activo → leer `eventInventories/{eventId}`
- Si no existe → usar `products` (inventario maestro)
- Al vender: actualizar stock en la colección correspondiente
- Guardar `eventId` en la orden para reportes

### Flujo de Cierre de Evento
1. Listar productos del evento con stock restante
2. Por cada producto: opciones "Eliminar" o "Reintegrar al maestro"
3. Si reintegrar: sumar stock al maestro
4. Marcar evento como `status: "closed"`, guardar `closedAt`

### Reportes por Evento
- Filtrar `orders` por `eventId`
- Métricas: total ventas, productos vendidos, margen (precio - costo), IVA (19% Chile), posición (% del total del evento)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/InventoryPage.jsx` | Modified | Separar vista maestro vs. por evento |
| `src/pages/SalesPage.jsx` | Modified | Lógica de selección de inventario, indicador de evento activo |
| `src/App.jsx` | Modified | Nuevas rutas/pages para gestión de eventos |
| `src/contexts/EventContext.jsx` | New | Estado global de evento activo |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Confusión de usuario entre maestro y evento | Medium | UI clara con labels, indicador siempre visible del evento activo |
| Ventas sin evento activo cuando debería haberlo | Low | Prompt al abrir ventas si hay evento activo pendiente |
| Pérdida de datos al cerrar evento | Medium | Confirmación antes de eliminar, opción de reintegrar todo |
| Complexidad de queries Firestore | Low | Índices compuestos para filtros por evento |

## Rollback Plan

1. Desactivar feature flag (si se implementa)
2. Las colecciones de eventos pueden consultarse pero no se usan en ventas
3. Queries de ventas pueden filtrar por `eventId: null` para ver ventas históricas pre-eventos

## Dependencies

- Ninguna dependencia externa nueva
- Mantener Firebase Firestore existente

## Success Criteria

- [ ] Usuario puede crear evento e importar productos del maestro con cantidades específicas
- [ ] Usuario puede vender con inventario del evento activo
- [ ] Usuario puede cerrar evento seleccionando productos a reintegrar/eliminar
- [ ] Dashboard muestra ventas del evento actual vs. maestro
- [ ] Reportes filtran por evento con métricas: ventas, margen, IVA, posición