# Guia Admin Frontend - Cambios unificados (Servicios + Tipos de entrega)

## Objetivo

Este documento unifica los cambios backend que impactan la parte administrativa del frontend:

1. Servicios con multiples precios por opcion (pricing options)
2. Nuevo modulo de tipos de entrega (delivery modes) para checkout

Se documenta solo lo que existe en backend actualmente.

---

## 1) Servicios con Pricing Options

## Razon de ser

Antes, cada servicio tenia solo un `price` y `uoM`.
Ahora, un servicio puede tener varias opciones de precio (por ejemplo, Por kilo, Bulto mediano, Por docena, etc.).

Esto permite administrar variaciones comerciales sin duplicar servicios.

---

## Catalogo de optionName permitido

| optionName | UoM requerido |
|---|---|
| Por kilo | KG |
| Por pieza | PZ |
| Por docena | DOC |
| Bulto pequeño | BULTO |
| Bulto mediano | BULTO |
| Bulto grande | BULTO |
| Bulto jumbo | BULTO |

---

## Endpoints administrativos de servicios

Base: `/api/Catalogs`

### Servicios

- `GET /services`
- `GET /services/{id}`
- `POST /services`
- `PUT /services/{id}`
- `DELETE /services/{id}`

### Pricing Options de un servicio

- `GET /services/{serviceId}/pricing-options`
- `POST /services/{serviceId}/pricing-options`
- `PUT /services/{serviceId}/pricing-options/{optionId}`
- `DELETE /services/{serviceId}/pricing-options/{optionId}`
- `GET /pricing-options/{optionId}/is-active`

---

## Contratos clave para pricing options

### POST /api/Catalogs/services/{serviceId}/pricing-options

Request:

```json
{
  "optionName": "Bulto mediano",
  "price": 90.0,
  "uoM": "BULTO",
  "isActive": true
}
```

Response 201:

```json
{
  "message": "Pricing option added successfully",
  "data": {
    "id": "guid",
    "serviceId": "guid",
    "optionName": "Bulto mediano",
    "price": 90.0,
    "uoM": "BULTO",
    "isActive": true,
    "createdAt": "2026-03-30T00:00:00Z",
    "updatedAt": "2026-03-30T00:00:00Z"
  }
}
```

### PUT /api/Catalogs/services/{serviceId}/pricing-options/{optionId}

Request:

```json
{
  "optionName": "Bulto mediano",
  "price": 95.0,
  "uoM": "BULTO",
  "isActive": true
}
```

Response 200:

```json
{
  "message": "Pricing option updated successfully",
  "data": {
    "id": "guid",
    "serviceId": "guid",
    "optionName": "Bulto mediano",
    "price": 95.0,
    "uoM": "BULTO",
    "isActive": true,
    "createdAt": "2026-03-30T00:00:00Z",
    "updatedAt": "2026-03-31T00:00:00Z"
  }
}
```

### DELETE /api/Catalogs/services/{serviceId}/pricing-options/{optionId}

Response 200:

```json
{
  "message": "Pricing option deleted successfully",
  "success": true
}
```

### GET /api/Catalogs/pricing-options/{optionId}/is-active

Response 200:

```json
{
  "isActive": true
}
```

---

## Reglas de negocio (pricing options)

1. `optionName` debe ser uno de los valores permitidos.
2. `uoM` debe coincidir con el `optionName`.
3. `price` debe ser mayor a 0.
4. No puede haber dos opciones con el mismo `optionName` dentro del mismo servicio.
5. Un servicio no puede quedarse sin al menos una opcion activa.

---

## 2) Nuevo modulo de Delivery Modes (Tipos de entrega)

## Razon de ser

Se agrego la seleccion de modo de entrega en checkout para controlar rapidez y costo.

Requisito clave aplicado:

- Sin llamadas a Catalogs al crear orden.
- Orders calcula y persiste todo localmente con snapshot.

---

## Catalogo inicial sembrado en Orders

| id | code | name | etaHours | surchargeAmount |
|---|---|---|---|---|
| 1 | EXPRESS_3H | Tres horas (Express) | 3 | 80.0 |
| 2 | SIX_HOURS | Seis horas | 6 | 50.0 |
| 3 | TWELVE_HOURS | Doce horas | 12 | 25.0 |
| 4 | TWENTY_FOUR_HOURS | 24 horas | 24 | 0.0 |

---

## Endpoint disponible para frontend

Base: `/api/Orders`

- `GET /delivery-modes`

Response 200:

```json
{
  "message": "Delivery modes retrieved successfully",
  "data": [
    {
      "id": 1,
      "code": "EXPRESS_3H",
      "name": "Tres horas (Express)",
      "etaHours": 3,
      "surchargeAmount": 80.0,
      "isActive": true,
      "sortOrder": 1
    },
    {
      "id": 4,
      "code": "TWENTY_FOUR_HOURS",
      "name": "24 horas",
      "etaHours": 24,
      "surchargeAmount": 0.0,
      "isActive": true,
      "sortOrder": 4
    }
  ]
}
```

---

## Integracion con create order

### POST /api/Orders

En `order`, enviar `deliveryModeId`.

Request (fragmento):

```json
{
  "order": {
    "userId": "user-123",
    "pickupDate": "2026-04-01",
    "pickupTime": "15:30:00",
    "deliveryModeId": 2
  },
  "orderDetails": [
    {
      "serviceId": "guid",
      "serviceName": "Lavado y Secado",
      "quantity": 1,
      "servicePrice": 90.0,
      "uoM": "BULTO"
    }
  ]
}
```

## Regla importante de backend

Backend recalcula y persiste:

- `deliveryFee = surchargeAmount(deliveryMode)`
- `totalAmount = sum(subtotales detalles) + deliveryFee`

Tambien guarda snapshot en la orden:

- `deliveryModeId`
- `deliveryModeCode`
- `deliveryModeName`
- `deliveryEtaHours`
- `deliveryModeSurcharge`

Si `deliveryModeId` no llega, backend usa por defecto id `4` (24 horas).

---

## Alcance administrativo actual del modulo de entrega

Actualmente backend expone para frontend administrativo:

- Lectura de tipos de entrega (`GET /api/Orders/delivery-modes`)

No existen aun endpoints de admin para crear/editar/eliminar delivery modes desde API.
Hoy esos valores se administran por seed/migracion y base de datos.

---

## Checklist para agente de frontend (Admin)

1. En modulo de servicios, manejar pricing options por servicio (CRUD con endpoints de Catalogs).
2. Validar en UI que optionName y uoM sean consistentes con el catalogo permitido.
3. En checkout/admin de ordenes, poblar selector de entrega con `GET /api/Orders/delivery-modes`.
4. En create order, enviar `deliveryModeId` (no code ni name como valor principal).
5. Mostrar montos estimados en UI, pero considerar que el backend recalcula `deliveryFee` y `totalAmount`.
