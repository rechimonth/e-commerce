# E-Commerce — Proyecto Integrador 5

SPA de e-commerce desarrollada con React 18, TypeScript, Vite, Firebase, AWS S3 y Vercel Serverless Functions. El proyecto implementa dos experiencias: **customer** para comprar y **admin** para gestionar productos y órdenes.

## Requisitos cubiertos

- Registro y login con email/password y Google.
- Persistencia de sesión con Firebase Auth.
- Roles `customer` y `admin` almacenados en Firestore.
- Catálogo desde Firestore, filtro por categoría y búsqueda con debounce.
- Carrito con Context API + useReducer y persistencia local.
- Checkout con pago **simulado** y creación real de la orden en Firestore.
- Historial y detalle de órdenes por usuario.
- Panel admin protegido por rol.
- CRUD de productos.
- Upload de imágenes mediante presigned URLs generadas por Vercel.
- Gestión de estados de órdenes.
- Tests unitarios/integración y mocks de Firebase/AWS.


## Arquitectura

```text
src/
├── types/            # contratos de dominio
├── infrastructure/   # Firebase SDK y DTOs
├── services/         # lógica de aplicación/adaptación
├── contexts/         # estado global de autenticación
├── store/cart/       # Context + useReducer del carrito
├── hooks/            # interfaz de consumo de estado y lógica reutilizable
├── components/       # UI reutilizable
└── pages/            # pantallas por ruta

api/                  # Vercel Serverless Functions
firestore.rules       # seguridad de Firestore
firestore.indexes.json # índices requeridos
```

La organización sigue el enfoque por capas estudiado: `types → services/infrastructure → state/hooks → UI/pages`.

## Flujo de checkout

```text
Customer
  ↓
Carrito
  ↓
Checkout
  ↓
Pago simulado
  ↓
createOrder()
  ↓
Firestore /orders/{id}
  ↓
clearCart()
  ↓
Historial de órdenes
```

Si Firestore falla, el carrito **no se limpia** y el usuario permanece en checkout con un mensaje de error.

## Flujo de upload S3

```text
Browser
  ↓ Bearer Firebase ID token
Vercel Function /api/upload
  ↓ verifyIdToken + role admin
Firebase Admin / Firestore
  ↓
AWS S3 presigned PUT URL
  ↓
Browser → S3
```

Las credenciales AWS son exclusivamente server-side. No deben comenzar con `VITE_` y nunca deben aparecer en el bundle del frontend.

### Configuración S3

El bucket debe permitir la operación PUT mediante la presigned URL. Para mostrar las imágenes con la URL estable que guarda el modelo `Product`, configurar una bucket policy de lectura únicamente para el prefijo de imágenes de productos, o sustituir el modelo por una estrategia de URLs de lectura presigned. No se utiliza `ACL: public-read`.

CORS debe permitir únicamente los orígenes de desarrollo y producción necesarios y los métodos `PUT`, `GET` y `HEAD`.

## Variables de entorno

### Frontend

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Server-only

```env
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=us-east-1
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
ALLOWED_ORIGINS=http://localhost:5173
```

Nunca subir `.env`. Usar `.env.example` sin valores reales.

## Instalación

Para configuración local detallada, consultar `docs/LOCAL_SETUP.md`.

```bash
npm ci
npm run dev
```

## Validaciones locales

```bash
npm run lint
npm run build
npm run typecheck:api
npm run test
```

Para las reglas de Firestore se requiere Firebase Emulator configurado.

## Firebase

1. Crear proyecto Firebase.
2. Activar Authentication con Email/Password y Google.
3. Crear Firestore.
4. Publicar `firestore.rules`.
5. Publicar `firestore.indexes.json`.

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Vercel

Configurar las variables frontend y server-only en Project Settings → Environment Variables. Las credenciales privadas nunca se colocan en variables `VITE_*`.

Producción: https://e-commerce-mauve-one-98.vercel.app/

## Testing

La suite utiliza Vitest y React Testing Library. Firebase y AWS se mockean para evitar dependencias externas en los tests unitarios. Los flujos críticos incluyen carrito, hooks, rutas, checkout, órdenes, admin y upload.

## Bitácora de IA

La bitácora original se conserva en `docs/ai-notes.md`. Debe mantenerse con al menos cinco entradas reales que documenten prompt, aprendizaje y decisión tomada, tal como exige el Proyecto 5.

## Defensa

La demo debe mostrar dos recorridos: customer (auth → catálogo → carrito → checkout → orden) y admin (auth → CRUD → upload → órdenes → cambio de estado).
