# Endpoints - Delivery Modes Module

Documentación completa de los endpoints del módulo de Delivery Modes en el microservicio de Orders.

---

## 1. GET /api/Orders/delivery-modes

Obtiene la lista de modos de entrega activos disponibles para el cliente.

### Descripción
Retorna todos los modos de entrega que están marcados como activos en el sistema, ordenados por prioridad (sortOrder).

### Request

```http
GET /api/Orders/delivery-modes
```

**Headers:**
```
Content-Type: application/json
```

**Query Parameters:** Ninguno

---

### Response

**Status Code:** `200 OK`

**Content-Type:** `application/json`

**Body:**
```json
[
  {
    "id": 1,
    "code": "EXPRESS_3H",
    "name": "Express - 3 Horas",
    "etaHours": 3,
    "surchargeAmount": 80.00,
    "isActive": true,
    "sortOrder": 1
  },
  {
    "id": 2,
    "code": "SIX_HOURS",
    "name": "Regular - 6 Horas",
    "etaHours": 6,
    "surchargeAmount": 50.00,
    "isActive": true,
    "sortOrder": 2
  },
  {
    "id": 3,
    "code": "TWELVE_HOURS",
    "name": "Estándar - 12 Horas",
    "etaHours": 12,
    "surchargeAmount": 25.00,
    "isActive": true,
    "sortOrder": 3
  },
  {
    "id": 4,
    "code": "TWENTY_FOUR_HOURS",
    "name": "Económico - 24 Horas",
    "etaHours": 24,
    "surchargeAmount": 0.00,
    "isActive": true,
    "sortOrder": 4
  }
]
```

### Estructura de Respuesta - DeliveryMode

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | integer | Identificador único del modo de entrega |
| `code` | string | Código único del modo (ej: EXPRESS_3H) |
| `name` | string | Nombre descriptivo del modo para mostrar al usuario |
| `etaHours` | integer | Tiempo estimado de entrega en horas |
| `surchargeAmount` | decimal | Costo adicional por este modo de entrega |
| `isActive` | boolean | Indica si el modo está disponible |
| `sortOrder` | integer | Orden de presentación en la UI (menor = más prioritario) |

### Ejemplo de Uso - cURL

```bash
curl -X GET "https://localhost:5001/api/Orders/delivery-modes" \
  -H "Content-Type: application/json"
```

### Ejemplo de Uso - JavaScript

```javascript
async function getDeliveryModes() {
  const response = await fetch('https://localhost:5001/api/Orders/delivery-modes', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  
  return await response.json();
}

// Uso
const modes = await getDeliveryModes();
console.log(modes);
```

---

## 2. POST /api/Orders (Modificado)

Crea una nueva orden con selección de modo de entrega.

### Descripción
Crea una orden incluyendo la selección del modo de entrega. El sistema:
- Valida que el modo de entrega sea válido y esté activo
- Calcula automáticamente el recargo de entrega
- Captura los datos del modo como snapshot en la orden

### Request

```http
POST /api/Orders
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "customerId": "cust-12345",
  "orderDetails": [
    {
      "serviceId": 1,
      "serviceName": "Lavado Express",
      "quantity": 5,
      "unitPrice": 100.00,
      "subTotal": 500.00
    },
    {
      "serviceId": 2,
      "serviceName": "Planchado",
      "quantity": 3,
      "unitPrice": 50.00,
      "subTotal": 150.00
    }
  ],
  "deliveryModeId": 2,
  "notes": "Entregar en la tarde, por favor"
}
```

### Estructura de Request - CreateOrderRequest

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `customerId` | string | ✓ | ID del cliente |
| `orderDetails` | array | ✓ | Lista de servicios en la orden (mínimo 1) |
| `orderDetails[].serviceId` | integer | ✓ | ID del servicio |
| `orderDetails[].serviceName` | string | ✓ | Nombre del servicio |
| `orderDetails[].quantity` | integer | ✓ | Cantidad |
| `orderDetails[].unitPrice` | decimal | ✓ | Precio unitario |
| `orderDetails[].subTotal` | decimal | ✓ | Subtotal (quantity × unitPrice) |
| `deliveryModeId` | integer | ✗ | ID del modo de entrega (default: 4 si no se especifica) |
| `notes` | string | ✗ | Notas adicionales para la entrega |

### Response

**Status Code:** `201 Created`

**Content-Type:** `application/json`

**Body:**
```json
{
  "id": 5001,
  "customerId": "cust-12345",
  "status": "Pending",
  "createdAt": "2026-03-30T22:45:53.1234567Z",
  "orderDetails": [
    {
      "serviceId": 1,
      "serviceName": "Lavado Express",
      "quantity": 5,
      "unitPrice": 100.00,
      "subTotal": 500.00
    },
    {
      "serviceId": 2,
      "serviceName": "Planchado",
      "quantity": 3,
      "unitPrice": 50.00,
      "subTotal": 150.00
    }
  ],
  "deliveryModeId": 2,
  "deliveryModeCode": "SIX_HOURS",
  "deliveryModeName": "Regular - 6 Horas",
  "deliveryEtaHours": 6,
  "deliveryModeSurcharge": 50.00,
  "subTotal": 650.00,
  "deliveryFee": 50.00,
  "totalAmount": 700.00,
  "notes": "Entregar en la tarde, por favor"
}
```

### Estructura de Response - Order

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | integer | ID único de la orden |
| `customerId` | string | ID del cliente |
| `status` | string | Estado de la orden (default: "Pending") |
| `createdAt` | datetime | Fecha y hora de creación |
| `orderDetails` | array | Detalles de servicios incluidos |
| `deliveryModeId` | integer | FK al modo de entrega seleccionado |
| `deliveryModeCode` | string | Snapshot: código del modo |
| `deliveryModeName` | string | Snapshot: nombre del modo |
| `deliveryEtaHours` | integer | Snapshot: horas de ETA |
| `deliveryModeSurcharge` | decimal | Snapshot: costo del recargo |
| `subTotal` | decimal | Suma de todos los servicios |
| `deliveryFee` | decimal | Costo de entrega (= deliveryModeSurcharge) |
| `totalAmount` | decimal | Monto total (subTotal + deliveryFee) |
| `notes` | string | Notas adicionales |

### Validaciones

✓ **Orden Details Requeridos:** Mínimo 1 servicio debe estar incluido
```json
{
  "message": "At least one order detail is required",
  "status": 400
}
```

✓ **Modo de Entrega Válido:** El deliveryModeId debe existir y estar activo
```json
{
  "message": "The specified delivery mode does not exist or is not active",
  "status": 400
}
```

✓ **Valor Default:** Si no se especifica `deliveryModeId`, se asigna automáticamente el modo 4 (TWENTY_FOUR_HOURS)

### Ejemplo de Uso - cURL

```bash
curl -X POST "https://localhost:5001/api/Orders" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cust-12345",
    "orderDetails": [
      {
        "serviceId": 1,
        "serviceName": "Lavado Express",
        "quantity": 5,
        "unitPrice": 100.00,
        "subTotal": 500.00
      }
    ],
    "deliveryModeId": 2,
    "notes": "Antes de las 6 PM"
  }'
```

### Ejemplo de Uso - JavaScript

```javascript
async function createOrder(orderData) {
  const response = await fetch('https://localhost:5001/api/Orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Error: ${error.message}`);
  }
  
  return await response.json();
}

// Uso
const newOrder = await createOrder({
  customerId: 'cust-12345',
  orderDetails: [
    {
      serviceId: 1,
      serviceName: 'Lavado Express',
      quantity: 5,
      unitPrice: 100.00,
      subTotal: 500.00
    }
  ],
  deliveryModeId: 2,
  notes: 'Entregar rápido'
});

console.log('Orden creada:', newOrder);
```

---

## 3. Reglas de Negocio

### Cálculo de Precios

El sistema calcula automáticamente los precios en el backend:

```
Subtotal = Σ(quantity × unitPrice) para cada OrderDetail
DeliveryFee = DeliveryMode.surchargeAmount
TotalAmount = Subtotal + DeliveryFee
```

**Ejemplo:**
```
Servicio 1: 5 × $100 = $500
Servicio 2: 3 × $50  = $150
Subtotal  = $650

Modo: SIX_HOURS con surcharge $50
DeliveryFee = $50

TotalAmount = $650 + $50 = $700
```

### Snapshot Pattern

Los datos del modo de entrega se capturan como **snapshot** en el momento de crear la orden:
- Si el modo cambia de precio en el futuro, la orden mantiene el precio que tenía en ese momento
- Esto asegura que los recargos históricos no cambien retroactivamente

### Default Automático

Si el cliente no especifica un `deliveryModeId`:
- Se asigna automáticamente el modo **4** (TWENTY_FOUR_HOURS)
- Esto garantiza que siempre hay un modo seleccionado

---

## 4. Códigos de Entrega Disponibles

Los siguientes son los modos de entrega seeded en la base de datos:

| ID | Code | Nombre | ETA | Surcharge |
|----|------|--------|-----|-----------|
| 1 | `EXPRESS_3H` | Express - 3 Horas | 3h | $80 |
| 2 | `SIX_HOURS` | Regular - 6 Horas | 6h | $50 |
| 3 | `TWELVE_HOURS` | Estándar - 12 Horas | 12h | $25 |
| 4 | `TWENTY_FOUR_HOURS` | Económico - 24 Horas | 24h | $0 |

---

## 5. Consideraciones de Integración

### Frontend (Checkout)

1. Llamar a `GET /api/Orders/delivery-modes` para obtener opciones disponibles
2. Mostrar los modos como opciones seleccionables (radio buttons o dropdown)
3. Actualizar el costo total visible al cambiar el modo
4. Enviar el `deliveryModeId` seleccionado en el campo `deliveryModeId` del POST

### Backend

- El cálculo de totales ocurre **en el servidor**, no en el cliente
- El cliente debe asumir que el servidor recalculará y validará de forma independiente
- No se valida si los precios del cliente coinciden; el servidor es la fuente de verdad

### Persistencia

- Los datos del modo quedan capturados en la orden (campos snapshot)
- Si necesitas editar el modo de una orden ya creada, se requeriría un nuevo endpoint (PUT /api/Orders/{id})
- Por ahora, los modos no pueden ser editados via API (catalog solo lectura para clientes)

---

## 6. Códigos de Estado HTTP

| Código | Significado |
|--------|------------|
| `200` | Solicitud exitosa (GET) |
| `201` | Recurso creado exitosamente (POST) |
| `400` | Solicitud inválida (delivery mode no existe, sin order details, etc.) |
| `500` | Error interno del servidor |

