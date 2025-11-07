# Postman Collection Guide

Guía para usar la colección de Postman y probar las notificaciones del Event Service.

## 📦 Archivos

- `Event_Service.postman_collection.json` - Colección con todos los endpoints
- `Event_Service.postman_environment.json` - Variables de entorno

## 🚀 Setup

1. **Importar en Postman:**
   - Abre Postman
   - Click en "Import" (arriba a la izquierda)
   - Arrastra o selecciona ambos archivos JSON
   - Asegúrate de que el environment "Event Service - Local" esté seleccionado

2. **Verificar variables:**
   - Click en el icono del ojo (👁️) arriba a la derecha
   - Verifica que `base_url` = `http://localhost:3000`
   - Verifica que `admin_token` = `admin-token-123`

3. **Iniciar el servidor:**
   ```bash
   npm run dev
   ```

## 🔔 Probar Notificaciones

### Opción 1: Usar el flujo completo de notificaciones

En la colección, busca la carpeta **"Notification Testing Flow"** y ejecuta los 3 requests en orden:

1. **1. Create DRAFT Event**
   - Crea un evento en estado DRAFT
   - ✅ Deberías ver en la consola: `[NOTIFICATION] New event created: Test Notification Event`

2. **2. Publish Event (DRAFT → PUBLISHED)**
   - Cambia el estado a PUBLISHED
   - ✅ Deberías ver en la consola: `[NOTIFICATION] Event published: Test Notification Event`

3. **3. Cancel Event**
   - Cancela el evento
   - ✅ Deberías ver en la consola: `[NOTIFICATION] Event cancelled: Test Notification Event`

### Opción 2: Probar individualmente

#### Notificación: Event Created
1. Ejecuta **"Create Event (DRAFT)"** o **"Create Event (PUBLISHED)"**
2. Revisa la consola del servidor donde corre `npm run dev`
3. Deberías ver: `[NOTIFICATION] New event created: <title>`

#### Notificación: Event Published
1. Primero crea un evento con status DRAFT
2. Copia el `id` del evento de la respuesta
3. Ejecuta **"Update Event - Publish (DRAFT → PUBLISHED)"**
   - Asegúrate de que `{{event_id}}` tenga el ID correcto
4. Revisa la consola del servidor
5. Deberías ver: `[NOTIFICATION] Event published: <title>`

#### Notificación: Event Cancelled
1. Crea o usa un evento PUBLISHED
2. Ejecuta **"Update Event - Cancel"**
3. Revisa la consola del servidor
4. Deberías ver: `[NOTIFICATION] Event cancelled: <title>`

## 📋 Endpoints Disponibles

### Health Check
- `GET /api/health` - Verifica que el servidor esté funcionando

### Admin Endpoints (requieren autenticación)
- `POST /api/events` - Crear evento
- `PATCH /api/events/:id` - Actualizar evento
- `GET /api/events` - Listar eventos (con filtros y paginación)

### Public Endpoints (sin autenticación)
- `GET /api/public/events` - Listar eventos públicos
- `GET /api/public/events/:id/summary` - Obtener resumen del evento (SSE)

## 🔍 Variables Automáticas

La colección guarda automáticamente IDs de eventos en variables:

- `event_id` - ID del último evento creado (DRAFT)
- `published_event_id` - ID del último evento publicado
- `notification_test_event_id` - ID del evento usado para testing de notificaciones

Estas variables se usan automáticamente en requests posteriores.

## 💡 Tips

1. **Ver notificaciones en tiempo real:**
   - Mantén la terminal donde corre `npm run dev` visible
   - Las notificaciones aparecen inmediatamente después de cada request

2. **Probar diferentes escenarios:**
   - Crea eventos con diferentes estados
   - Prueba transiciones inválidas (ej: PUBLISHED → DRAFT) para ver errores

3. **Verificar campos privados:**
   - Los endpoints admin (`/api/events`) incluyen `internalNotes`, `createdBy`, `updatedAt`
   - Los endpoints públicos (`/api/public/events`) NO incluyen estos campos

4. **Probar caché de resúmenes:**
   - Ejecuta `Get Event Summary` dos veces
   - Primera vez: `X-Summary-Cache: MISS`
   - Segunda vez: `X-Summary-Cache: HIT`

## 🐛 Troubleshooting

**No veo notificaciones en la consola:**
- Verifica que el servidor esté corriendo (`npm run dev`)
- Revisa que el request haya sido exitoso (status 201 o 200)
- Las notificaciones son asíncronas, pueden tardar unos milisegundos

**Error 401 Unauthorized:**
- Verifica que el header `Authorization: Bearer {{admin_token}}` esté presente
- Verifica que `admin_token` en el environment sea `admin-token-123`

**Error 400 Validation Error:**
- Verifica que las fechas estén en formato ISO 8601: `2025-12-15T20:00:00.000Z`
- Verifica que `startAt` sea en el futuro
- Verifica que `startAt < endAt`

## 📝 Ejemplo de Output Esperado

Cuando ejecutas el flujo completo de notificaciones, deberías ver en la consola del servidor:

```
[NOTIFICATION] New event created: Test Notification Event
[NOTIFICATION] Event published: Test Notification Event
[NOTIFICATION] Event cancelled: Test Notification Event
```

