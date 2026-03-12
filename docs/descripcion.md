# Documentación de Frontend: Módulo de Recolectores - LaundrApp

## 1. Descripción del Proyecto
Este módulo frontend está diseñado para la gestión logística de recolectores en un servicio de lavandería a domicilio. La aplicación permite a los colaboradores visualizar pedidos disponibles, auto-asignarse tareas, registrar evidencias fotográficas de cada etapa y reportar su ubicación en tiempo real mediante una **Progressive Web App (PWA)**.

---

## 2. Requerimientos Funcionales

### A. Gestión de Pedidos (Pool de Tareas)
* **Visualización:** Listado de pedidos pendientes de recolección con prioridad por cercanía.
* **Detalle de Tiempo:** Cada tarjeta debe mostrar claramente la **hora programada de recolección**.
* **Auto-asignación:** El recolector puede seleccionar un pedido del listado global para moverlo a su lista personal ("Mis Tareas").

### B. Flujo Operativo (Pasos Obligatorios)
1. **Recolección:** Confirmación de llegada al domicilio.
2. **Evidencia de Entrada:** Captura de foto de las prendas recibidas.
3. **Sellado:** Captura de foto del precinto/sello de seguridad colocado en la bolsa.
4. **Entrega en Centro:** Check-in en la planta de lavado.
5. **Entrega al Cliente:** Captura de foto de evidencia de entrega final en domicilio.

### C. Geolocalización y Tracking
* **Ubicación en Tiempo Real:** Transmisión de coordenadas mientras el recolector está en tránsito (Recolección/Entrega).
* **Geofencing Web:** Habilitación inteligente de botones de acción basados en el radio de proximidad (aprox. 50m) al destino.

---

## 3. Arquitectura de Pantallas (UI/UX)

| Pantalla | Componentes Clave | Acciones Principales |
| :--- | :--- | :--- |
| **Explorar Pedidos** | Cards con ID, Hora, Dirección y Distancia. | Botón `[Auto-asignarse]` |
| **Mi Ruta** | Mapa con pines de ruta óptima y lista de tareas aceptadas. | Selección de tarea activa. |
| **Detalle de Tarea** | Información del cliente, notas y botón de Navegación GPS. | Botón `[Iniciar Recorrido]` |
| **Cámara de Evidencia** | Visor de cámara con overlay de guías. | `[Capturar Foto]`, `[Subir]` |

---

## 4. Especificaciones Técnicas (Stack Sugerido)

* **Framework:** Angular 19 (Uso de **Signals** para manejo de estado de GPS).
* **Capacidad Offline:** Service Workers (PWA) para almacenamiento de fotos en `IndexedDB` si no hay conexión.
* **Comunicación:** SignalR / WebSockets para actualización de pool de pedidos y tracking.
* **Geofencing:** Implementación mediante `navigator.geolocation.watchPosition` con validación de distancia Haversine en el cliente.

---

## 5. Modelos de Datos (Estructura JSON)

### Objeto: Pedido para Recolector
```json
{
  "pedidoId": "uuid-12345",
  "cliente": "Nombre Cliente",
  "direccion": "Calle Falsa 123",
  "coordenadas": { "lat": 19.4326, "lng": -99.1332 },
  "horaRecoleccion": "2026-03-09T14:30:00Z",
  "estado": "Disponible", // [Disponible, Asignado, EnCamino, Recolectado]
  "evidencias": {
    "recoleccion": null, // URL o Base64
    "sello": null,
    "entrega": null
  }
}