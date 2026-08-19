# ECOMMERCE AI

![ECOMMERCE AI](https://img.shields.io/badge/ECOMMERCE_AI-React%2018%20%2B%20TypeScript%20%2B%20Vite-blue)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-orange)
![AWS S3](https://img.shields.io/badge/AWS%20S3-Presigned%20URLs-green)
![Vercel](https://img.shields.io/badge/Vercel-Serverless%20Functions-black)

Una tienda online sencilla donde los usuarios pueden buscar productos, agregarlos al carrito y realizar compras, mientras que los administradores gestionan el catálogo y las órdenes desde un panel protegido.

---

## 📋 Sobre el proyecto

ECOMMERCE AI es una aplicación web desarrollada para un cliente del sector retail. La idea es tener una tienda online funcional con dos roles:

- **Cliente**: navega el catálogo, usa el carrito y hace compras.
- **Administrador**: crea y edita productos, ve todas las órdenes y cambia sus estados.

La aplicación está pensada para ser mantenible y escalable sin necesidad de administrar servidores propios.

---

## 🎯 Objetivo

- Aplicar una arquitectura por capas en React para que cada parte tenga una responsabilidad clara.
- Usar Firebase para autenticación y base de datos en tiempo real.
- Guardar imágenes de productos en AWS S3 sin exponer credenciales en el frontend.
- Probar componentes y lógica de negocio con Vitest y React Testing Library.
- Documentar el proceso de desarrollo y las decisiones técnicas en una bitácora de IA.

---

## 🛒 ¿Qué puedo hacer?

### Como cliente
1. Registrarse o iniciar sesión con email/contraseña o Google.
2. Navegar el catálogo de productos.
3. Buscar productos por nombre.
4. Filtrar productos por categoría.
5. Ver el detalle de un producto.
6. Agregar productos al carrito.
7. Modificar cantidades o eliminar productos del carrito.
8. Realizar el checkout con datos de envío y pago simulado.
9. Ver el historial de órdenes.
10. Ver el detalle de una orden, incluyendo seguimiento de envío y archivos adjuntos.
11. Cancelar una orden si todavía está en estado `pending`.

### Como administrador
1. Acceder a un panel administrativo protegido por rol.
2. Ver un dashboard con métricas generales.
3. Crear, editar y eliminar productos.
4. Subir imágenes de productos a AWS S3.
5. Ver todas las órdenes del sistema.
6. Filtrar órdenes por estado.
7. Cambiar el estado de una orden.
8. Gestionar usuarios y categorías.
9. Ver archivos subidos y analytics básico.

---

## 🎮 Categorías

| Categoría | Descripción |
|---|---|
| Videojuegos | Productos relacionados con videojuegos. |
| Figuras de acción | Figuras y coleccionables. |
| Zapatillas | Calzado y modelos disponibles. |

---

## ✨ Funcionalidades

### Cliente
- Registro y login con email/password y Google.
- Persistencia de sesión al recargar la página.
- Catálogo de productos desde Firestore.
- Búsqueda por nombre con debounce.
- Filtro por categoría.
- Carrito con Context API y useReducer.
- Checkout con pago simulado.
- Creación de órdenes en Firestore.
- Historial y detalle de órdenes.
- Cancelación de órdenes en estado `pending`.
- Visualización de tracking y adjuntos en órdenes.

### Administrador
- Acceso protegido por rol.
- Dashboard con métricas.
- CRUD completo de productos.
- Upload de imágenes mediante presigned URLs.
- Gestión de órdenes con filtros por estado.
- Cambio de estado de órdenes.
- Gestión de usuarios y categorías.
- Sección de uploads/media.
- Páginas de Analytics, Auditoría y Configuración.

---

## 🧩 Cómo funciona

La aplicación está dividida en tres partes principales:

1. **Frontend**: React + TypeScript + Vite. El usuario interactúa con páginas y componentes reutilizables.
2. **Backend como servicio**: Firebase maneja la autenticación y Firestore guarda productos, órdenes y perfiles.
3. **Serverless**: Vercel Functions genera URLs temporales para subir imágenes a AWS S3 sin exponer credenciales.

El flujo típico de compra:
- El usuario inicia sesión.
- Agrega productos al carrito.
- Confirma el checkout y se crea una orden en Firestore.
- El carrito se limpia automáticamente.
- El usuario puede consultar sus órdenes.

El flujo de imágenes:
- El admin solicita una URL de subida a `/api/upload`.
- La función verifica que sea admin, genera una presigned URL de S3 y registra el archivo en Firestore.
- El admin sube el archivo directamente a S3 usando esa URL temporal.

---

## 🏗️ Arquitectura

El proyecto sigue una separación por capas:

- `src/pages`: pantallas o vistas de la aplicación.
- `src/components`: componentes reutilizables de UI y layout.
- `src/hooks`: lógica reutilizable conectada a contexts o servicios.
- `src/contexts`: estado global de autenticación.
- `src/store/cart`: estado global del carrito con Context API + useReducer.
- `src/services`: lógica de aplicación para checkout, órdenes, productos, etc.
- `src/infrastructure`: conexión con Firebase, mappers y configuración.
- `src/types`: interfaces y tipos de TypeScript.
- `src/utils`: funciones puras auxiliares.
- `api`: Vercel Serverless Functions.

Esta separación permite encontrar la lógica de negocio sin tener que revisar componentes de UI.

---

## 📁 Estructura del proyecto

```
src/
├── app/                    # Enrutamiento y providers globales
├── components/
│   ├── admin/             # Layout del panel administrativo
│   ├── auth/              # Protección de rutas
│   ├── cart/              # Componentes del carrito
│   ├── catalog/           # Listado, búsqueda y filtros
│   ├── common/            # Spinners y utilidades
│   ├── layout/            # Header y estructura general
│   ├── ui/                # Botones, inputs, cards, badges, modales
│   └── upload/            # Upload de imágenes
├── config/                # Configuración de Firebase
├── constants/             # Rutas, checkout, categorías
├── contexts/              # AuthContext
├── hooks/                 # useCart, useAuth, useCheckout, useOrders, useProducts
├── infrastructure/
│   └── firebase/          # Auth, Firestore, adapters, configuración
├── pages/
│   ├── admin/             # Dashboard, Products, Orders, Users, Categories, Uploads, Analytics, Audit, Settings
│   └── ...                # Home, Catalog, ProductDetail, Cart, Checkout, Orders, OrderDetail, Login, Register
├── services/              # checkoutService, ordersService, productsService, dashboardService
├── store/cart/            # CartProvider, reducer, persistencia
├── styles/                # Estilos globales
├── test/                  # Fixtures, mocks, setup, renderWithProviders
├── types/                 # Interfaces de dominio, order, pricing, cart, auth, api
└── utils/                 # cartUtils, export

api/
├── upload.ts              # Vercel Function para presigned URLs S3
└── health.ts              # Health check

tests/
├── integration/           # Flujos completos
└── unit/                  # Componentes, hooks, services, seguridad

firestore.rules            # Reglas de seguridad
firestore.indexes.json     # Índices compuestos
vercel.json                # Configuración de deploy
```

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| React 18 | Interfaz de usuario |
| TypeScript | Tipado estricto |
| Vite | Build y desarrollo |
| React Router | Navegación |
| TailwindCSS | Estilos |
| Context API + useReducer | Estado global del carrito |
| Firebase Auth | Registro, login y roles |
| Firestore | Base de datos en tiempo real |
| AWS S3 | Almacenamiento de imágenes |
| Vercel Serverless Functions | Backend sin servidor |
| Vitest | Tests |
| React Testing Library | Tests de componentes |
| ESLint + Prettier | Calidad de código |

---

## 🔐 Seguridad

- Las credenciales de Firebase y AWS se manejan exclusivamente por variables de entorno.
- El archivo `.env` está ignorado por Git.
- `.env.example` contiene los nombres de las variables sin valores reales.
- Las credenciales de AWS solo existen en las Vercel Functions; nunca se envían al frontend.
- Las rutas de administración están protegidas por rol.
- Firestore tiene reglas de seguridad que validan roles y pertenencia de datos desde el servidor.

---

## 🔥 Firebase

Firebase se usa para tres cosas principales:

1. **Authentication**: login con email/contraseña y Google, logout y persistencia de sesión.
2. **Firestore**: guarda productos, órdenes, perfiles de usuario y registros de uploads.
3. **Roles**: cada usuario tiene un documento en `users/{uid}` con un campo `role` (`customer` o `admin`).

El flujo de autenticación:
- El usuario se registra o inicia sesión.
- Firebase Auth devuelve un usuario autenticado.
- La aplicación lee el documento de perfil en Firestore para obtener el rol.
- Ese rol se guarda en el contexto de autenticación y se usa para proteger rutas y reglas.

---

## ☁️ AWS / S3

Las imágenes de productos se guardan en AWS S3.

El flujo es el siguiente:
1. El administrador elige una imagen desde el panel.
2. El frontend llama a `/api/upload` con el token de Firebase.
3. La Vercel Function verifica que el usuario sea admin, consulta Firebase Admin y genera una URL temporal firmada para subir a S3.
4. El frontend sube el archivo directamente a S3 usando esa URL.
5. La función guarda el registro en Firestore y lo asocia al producto o a la orden.

De esta forma, las credenciales de AWS nunca salen del servidor.

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/rechimonth/e-commerce.git
cd e-commerce
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env` en la raíz con las variables que aparecen en `.env.example`.

Variables frontend:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Variables server-only (solo para Vercel Functions):
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `AWS_REGION`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `ALLOWED_ORIGINS`

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Luego abrir `http://localhost:5173`.

### 5. Validar el proyecto

```bash
npm run lint
npm run build
npm run test
```

Para probar las reglas de Firestore es necesario tener el Firebase Emulator corriendo.

---

## 🔑 Variables de entorno

| Variable | Uso |
|---|---|
| `VITE_FIREBASE_API_KEY` | Configuración pública de Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio de autenticación |
| `VITE_FIREBASE_PROJECT_ID` | ID del proyecto Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de Firebase Storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID de mensajería |
| `VITE_FIREBASE_APP_ID` | ID de la app Firebase |
| `AWS_ACCESS_KEY_ID` | Credencial AWS para Vercel Functions |
| `AWS_SECRET_ACCESS_KEY` | Credencial AWS para Vercel Functions |
| `AWS_S3_BUCKET` | Nombre del bucket S3 |
| `AWS_REGION` | Región de AWS |
| `FIREBASE_PROJECT_ID` | Proyecto Firebase para Admin SDK |
| `FIREBASE_CLIENT_EMAIL` | Cuenta de servicio Firebase |
| `FIREBASE_PRIVATE_KEY` | Llave privada de servicio Firebase |
| `ALLOWED_ORIGINS` | Orígenes permitidos para CORS en `/api/upload` |

---

## 🧪 Tests

La suite usa Vitest y React Testing Library.

```bash
npm run test
```

Firebase y AWS se mockean en los tests unitarios para evitar dependencias externas. Los tests cubren:

- Reducer del carrito.
- Custom hooks (`useCart`, `useAuth`, `useCheckout`, `useOrders`).
- Componentes de UI y páginas.
- Flujos de integración.
- Reglas de Firestore.

---

## 🌐 Deploy

La aplicación está diseñada para deployarse en Vercel con integración continua desde GitHub.

Configuración:
- `vercel.json` define el directorio de salida `dist` y el rewrite SPA hacia `index.html`.
- Las variables de entorno se configuran en Vercel Project Settings.
- El build de producción corre `tsc --noEmit` y `vite build`.

URL de producción:
https://e-commerce-mauve-one-98.vercel.app/

---

## 📊 Cumplimiento de Proyecto 5

A continuación se compara el estado real del proyecto contra los requisitos del documento del proyecto.

### Requisitos funcionales

| Requisito | Estado | Evidencia |
|---|---|---|
| Registro con email/password | ✅ | `src/pages/RegisterPage.tsx`, `AuthProvider.tsx` |
| Login con Google | ✅ | `AuthProvider.tsx` incluye `signInWithGoogle` |
| Logout | ✅ | `AuthProvider.tsx` incluye `handleSignOut` |
| Diferenciación de roles customer/admin | ✅ | Roles almacenados en Firestore y validados en frontend y reglas |
| Persistencia de sesión | ✅ | `observeAuthState` en `AuthProvider.tsx` |
| Listar productos desde Firestore | ✅ | `CatalogPage.tsx`, `useProducts.ts` |
| Filtrar por categoría | ✅ | `ProductFilters.tsx`, `CatalogPage.tsx` |
| Búsqueda por nombre con debounce | ✅ | `ProductSearch.tsx`, `useDebounce.ts` |
| Ver detalle de producto | ✅ | `ProductDetailPage.tsx` |
| Agregar productos al carrito | ✅ | `CartProvider.tsx`, `ProductCard.tsx` |
| Eliminar productos del carrito | ✅ | `CartPage.tsx`, `cartReducer` |
| Actualizar cantidad | ✅ | `QuantitySelector.tsx`, `cartReducer` |
| Calcular total automáticamente | ✅ | `cartUtils.ts` |
| Persistir carrito en Context | ✅ | `CartProvider.tsx` con persistencia local |
| Flujo de checkout | ✅ | `CheckoutPage.tsx`, `checkoutService.ts` |
| Checkout de pago simulado | ✅ | `SIMULATED_PAYMENT_DELAY_MS` en `checkoutService.ts` |
| Crear orden en Firestore con estados | ✅ | `ordersService.ts`, `OrderStatus` con `pending/processing/completed/cancelled` |
| Historial de órdenes del usuario | ✅ | `OrdersPage.tsx` |
| Ver detalle de órdenes pasadas | ✅ | `OrderDetailPage.tsx` |
| CRUD completo de productos | ✅ | `ProductsPage.tsx`, `ProductFormPage.tsx`, `productsService.ts` |
| Upload de imágenes a AWS S3 | ✅ | `api/upload.ts`, `AdminOrderDetailPage.tsx` |
| Ver todas las órdenes | ✅ | `AdminOrdersPage.tsx` |
| Filtrar órdenes por estado | ✅ | `AdminOrdersPage.tsx` |
| Cambiar estado de órdenes | ✅ | `AdminOrderDetailPage.tsx` |
| Layout diferenciado del panel | ✅ | `AdminLayout.tsx` |
| Mobile-first / UI responsiva | ✅ | Tailwind con breakpoints `sm:`, `md:`, `lg:` |
| Spinners / skeletons | ✅ | `LoadingState.tsx`, `Skeleton.tsx` |
| Mensajes cuando no hay datos | ✅ | `EmptyState.tsx` |
| Manejo visual de errores | ✅ | `ErrorState.tsx` |
| Componentes reutilizables | ✅ | `Button`, `Input`, `Card`, `Badge`, `Modal`, etc. |
| Validación de formularios | ✅ | `CheckoutPage.tsx`, `ProductFormPage.tsx` |
| Wrapper de providers para tests | ✅ | `src/test/renderWithProviders.tsx` |
| Tests de custom hooks aislados | ✅ | `tests/unit/hooks/*` |
| Tests de cartReducer | ✅ | `tests/unit/reducers/cartReducer.test.ts` |
| Tests de integración | ✅ | `tests/integration/*` |
| Mockear Firebase y AWS | ✅ | `src/test/setup.ts`, `src/test/mocks/*` |
| Deploy en Vercel con CI | ✅ | `vercel.json`, integración con GitHub |
| URL pública funcional | ✅ | `https://e-commerce-mauve-one-98.vercel.app/` |
| Variables de entorno en Vercel | ✅ | Documentadas en `.env.example` y README |
| Build de producción optimizado | ✅ | `npm run build` verificado |
| `.env` en `.gitignore` | ✅ | `.gitignore` incluye `.env`, `.env.local`, `.env*.local` |
| Commits sin variables de entorno | ✅ | No hay archivos `.env` en el repositorio |
| Validación de roles en frontend | ✅ | `AdminRoute.tsx`, `ProtectedRoute.tsx` |
| Reglas de seguridad Firestore | ✅ | `firestore.rules` con `isAdmin()`, `isOwner()`, `isOrderOwner()` |

### Requisitos técnicos

| Requisito | Estado | Evidencia |
|---|---|---|
| React 18 | ✅ | `package.json` |
| TypeScript | ✅ | `package.json` |
| Vite | ✅ | `package.json` |
| React Router | ✅ | `package.json` |
| TailwindCSS | ✅ | `package.json`, `tailwind.config.ts` |
| Context API | ✅ | `AuthContext`, `CartContext` |
| Firebase Auth | ✅ | `src/infrastructure/firebase/auth.ts` |
| Firestore | ✅ | `src/infrastructure/firebase/firestore.ts` |
| AWS S3 | ✅ | `api/upload.ts` |
| Vercel Serverless Functions | ✅ | `api/upload.ts`, `api/health.ts` |
| Vitest | ✅ | `package.json` |
| React Testing Library | ✅ | `package.json` |

### Requisitos de documentación

| Requisito | Estado | Evidencia |
|---|---|---|
| README profesional | ✅ | Este archivo |
| Decisiones arquitectónicas | ✅ | Sección `🧩 Cómo funciona` y `🏗️ Arquitectura` |
| Instrucciones de instalación | ✅ | Sección `🚀 Instalación` |
| Variables de entorno | ✅ | Sección `🔑 Variables de entorno` |
| URL de producción | ✅ | Sección `🌐 Deploy` |
| Flujo de upload S3 | ✅ | Sección `☁️ AWS / S3` |
| Bitácora de IA | ✅ | Sección `📝 Bitácora de IA` |

---

## ⚠️ Problemas conocidos

- Algunas funcionalidades dependen de que Firebase y AWS estén configurados correctamente mediante variables de entorno.
- El deploy en Vercel requiere que las variables de entorno estén creadas en Project Settings; si falta alguna, la función `/api/upload` falla.
- Las reglas de Firestore y los índices compuestos deben publicarse con `firebase deploy --only firestore:rules,firestore:indexes`.
- El proyecto se ve en blanco si el build en Vercel usa una versión de TypeScript incompatible con los tipos de `firebase-admin`; se recomienda revisar el type-check antes de deployar.

---

## 🎓 Para presentar el proyecto

### Problema que resuelve
Es una tienda online simple donde un cliente puede comprar productos y un administrador puede gestionar el catálogo y las órdenes, sin necesidad de mantener servidores propios.

### Tecnologías
React 18 + TypeScript + Vite en el frontend; Firebase Auth + Firestore en la nube; AWS S3 para imágenes; Vercel para deploy y funciones serverless.

### Cómo funciona el carrito
El carrito usa Context API + useReducer. Cada acción (agregar, eliminar, cambiar cantidad, limpiar) pasa por un reducer puro que devuelve un nuevo estado. Eso hace que el carrito sea predecible y fácil de testear.

### Cómo funciona el checkout
El usuario confirma el carrito, se simula un pago y se crea una orden en Firestore. Si algo falla, el carrito no se limpia y el usuario ve un mensaje de error.

### Cómo funcionan las órdenes
Cada orden tiene un estado (`pending`, `processing`, `completed`, `cancelled`) y un historial de cambios. El cliente ve sus propias órdenes; el admin ve todas y puede cambiar estados.

### Cómo se manejan las imágenes
El admin sube imágenes desde el panel. Una Vercel Function genera una URL temporal de S3, el archivo se sube directamente desde el navegador y el registro se guarda en Firestore. Las credenciales de AWS nunca salen del servidor.

### Uso de IA
Durante el desarrollo se usó IA para planificar la arquitectura, revisar código, validar decisiones técnicas, generar tests y resolver problemas específicos. La bitácora completa está en `docs/ai-notes.md`.

---

## 📝 Bitácora de IA

La bitácora completa se encuentra en [`docs/ai-notes.md`](docs/ai-notes.md).

Resumen de entradas documentadas:
- Planificación y generación de fixtures/wrappers de testing.
- Code review para reemplazar emojis por iconos SVG.
- Resolución de problemas con IDs inestables en formularios.
- Mejora visual de componentes base y compuestos.
- Renombre del proyecto y ajustes de documentación.
- Generación de tests de seguridad Firestore.

Cada entrada incluye el prompt o problema planteado, la respuesta obtenida, lo que se aprendió y la decisión final tomada.

---

## 👨‍💻 Autor

Nicolás/Hugo Rechimont

---

## 📄 Licencia

Proyecto académico — Proyecto Integrador 5.
