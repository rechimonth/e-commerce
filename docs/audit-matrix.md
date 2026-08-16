# Matriz de Auditoría — Proyecto Integrador 5

> **Evaluador**: Kilo (Release Engineer)  
> **Fecha**: 16/8/2026  
> **Metodología**: Evaluación contra requisitos oficiales del Proyecto 5, usando exclusivamente el código del repositorio como fuente de verdad.  
> **Comandos de verificación**: `npm run build`, `npm run lint`, `npm run test`

---

## Resumen de comandos

| Comando | Estado | Detalle |
|---------|--------|---------|
| `npm run build` | ✅ PASS | `tsc --noEmit -p tsconfig.app.json && vite build` — 0 errores |
| `npm run lint` | ✅ PASS | `eslint . --max-warnings=0` — 0 errores, 0 warnings |
| `npm run test` | ⚠️ 36/397 fallos | 11 archivos fallidos, 361 tests pasan (91%) |

---

## Matriz de requisitos

| Requisito | Estado | Evidencia | Archivo(s) | Riesgo |
|-----------|--------|-----------|------------|--------|
| **Authentication** | PASS | Firebase Auth configurado: `signInWithEmail`, `signUpWithEmail`, `signInWithGoogle`, `signOut`, `observeAuthState` | `src/infrastructure/firebase/auth.ts`, `src/contexts/AuthProvider.tsx` | Bajo |
| **Roles** | PASS | Tipos `UserRole` (`customer`/`admin`) y `UserRoleState`. Role guardado en perfil Firestore. `AdminRoute` protege rutas. | `src/types/auth.ts`, `src/components/auth/AdminRoute.tsx` | Bajo |
| **Session persistence** | PASS | `observeAuthState` mantiene sesión entre recargas. Firebase Auth persiste token automáticamente. | `src/infrastructure/firebase/auth.ts:129-146` | Bajo |
| **Firestore** | PASS | SDK configurado. CRUD productos y órdenes con DTOs tipados y adaptadores. | `src/infrastructure/firebase/firestore.ts`, `src/infrastructure/firebase/adapters.ts` | Bajo |
| **Product catalog** | PASS | Catálogo con grid, tarjetas, paginación. `useProducts` + `productsService.fetchProducts`. | `src/pages/CatalogPage.tsx`, `src/hooks/useProducts.ts` | Bajo |
| **Category filter** | PASS | `CategoryFilter` component. Filtro por categoría en `useProducts` y `productsService`. | `src/components/catalog/CategoryFilter.tsx`, `src/hooks/useProducts.ts:28` | Bajo |
| **Debounced search** | PASS | `useDebounce` (300ms) aplicado a `searchTerm` en `useProducts`. | `src/hooks/useDebounce.ts`, `src/hooks/useProducts.ts:28` | Bajo |
| **Product detail** | PASS | `ProductDetailPage` con imagen, precio, descripción, stock, selector de cantidad, agregar al carrito. | `src/pages/ProductDetailPage.tsx`, `src/hooks/useProduct.ts` | Bajo |
| **Cart** | PASS | `CartProvider` + `useCart`. Carrito con items, totales, persistencia en localStorage. | `src/store/cart/CartProvider.tsx`, `src/pages/CartPage.tsx` | Bajo |
| **Context API** | PASS | `AuthContext` + `AuthProvider`, `CartContext` + `CartProvider`. Consumidos via hooks. | `src/contexts/AuthContext.tsx`, `src/store/cart/CartContext.ts` | Bajo |
| **useReducer** | PASS | `cartReducer` con acciones tipadas. Inicialización lazy desde localStorage. | `src/utils/cart/cartUtils.ts`, `src/store/cart/CartProvider.tsx:28` | Bajo |
| **Checkout** | PARTIAL | Formulario completo (envío, facturación, pago, notas). `useCheckout` + `checkoutService`. **Sin pasarela de pago real** (simulado). 2 tests fallan. | `src/pages/CheckoutPage.tsx`, `src/hooks/useCheckout.ts` | Medio |
| **Orders** | PASS | `OrdersPage` con historial. `OrderDetailPage` con resumen financiero. Creación desde checkout. | `src/pages/OrdersPage.tsx`, `src/pages/OrderDetailPage.tsx` | Bajo |
| **Order status** | PASS | Estados: pending/processing/completed/cancelled. `canTransition` para validar transiciones. Badge de estado. | `src/types/order.ts`, `src/components/ui/OrderStatusBadge.tsx` | Bajo |
| **Order history** | PASS | `statusHistory` en tipo Order. Mostrado en `OrderDetailPage`. | `src/types/order.ts`, `src/pages/OrderDetailPage.tsx:171-194` | Bajo |
| **Admin** | PASS | Layout admin, dashboard, CRUD productos, gestión órdenes, upload de imágenes. | `src/components/admin/AdminLayout.tsx`, `src/pages/admin/*` | Bajo |
| **CRUD** | PASS | Productos: create/read/update/delete. Órdenes: read/update status. Firestore rules restringen por rol. | `src/services/productsService.ts`, `src/services/ordersService.ts` | Bajo |
| **S3** | PARTIAL | Presigned PUT URLs generadas en `api/upload.ts`. **CORS de bucket no configurado/documentado**. **Política IAM no documentada**. | `api/upload.ts` | Medio |
| **Presigned URLs** | PASS | `getSignedUrl` con expiración 300s. Cliente sube directo a S3. ACL private. | `api/upload.ts:206-208` | Bajo |
| **Vercel Functions** | PASS | `/api/upload` como Serverless Function. `vercel.json` con rutas API. CORS headers. | `api/upload.ts`, `vercel.json` | Bajo |
| **Security** | PARTIAL | Firestore rules comprehensivos. **Upload handler usa token simulado** (`TODO: Replace with real firebase-admin verification`). **Sin índices compuestos Firestore**. | `firestore.rules`, `api/upload.ts:75-89` | Alto |
| **Firestore Rules** | PASS | Rules completos: validación de precios, items, campos, roles, catch-all deny. Suite de tests de seguridad. | `firestore.rules`, `tests/unit/security/firestore.rules.test.ts` | Bajo |
| **Environment variables** | PARTIAL | `.env.example` existe. `.env` presente (gitignored). **Faltan configurar en Vercel dashboard**. Secretos AWS solo server-side. | `.env.example`, `.env`, `vercel.json` | Alto |
| **Testing** | PARTIAL | 361/397 tests pasan (91%). Infraestructura de tests: fixtures, mocks, `renderWithProviders`. **36 tests fallan**. | `tests/`, `src/test/` | Alto |
| **Mocks** | PARTIAL | Mocks de Firebase y AWS en `src/test/mocks/`. **Tests de infraestructura fallan por conflictos de `vi.resetModules()` + `getApps()`**. Algunos tests crashean por `AuthProvider` sin mock de Firebase config. | `src/test/mocks/firebase.ts`, `src/test/setup.ts` | Alto |
| **Integration tests** | PARTIAL | Tests de routing, componentes y flujo integrado existen. **6 tests de integración fallan** (routing + flow). | `tests/integration/` | Medio |
| **Mobile-first** | PASS | Responsive con Tailwind: `grid-cols-1 lg:grid-cols-2`, formularios apilados, padding responsive. | `src/pages/*`, `src/components/ui/` | Bajo |
| **Loading states** | PASS | `LoadingState`, `Spinner`, `Skeleton` components. Estados `isLoading` en hooks y páginas. | `src/components/ui/LoadingState.tsx`, `src/components/ui/Spinner.tsx` | Bajo |
| **Empty states** | PASS | `EmptyState` component con configuraciones reutilizables (`EMPTY_STATES`). Usado en catálogo, carrito, órdenes. | `src/components/ui/EmptyState.tsx`, `src/types/ui.ts` | Bajo |
| **Error states** | PASS | `ErrorState` component con retry. Manejo de errores en hooks (`useProducts`, `useOrders`, `useCheckout`). | `src/components/ui/ErrorState.tsx`, `src/hooks/*` | Bajo |
| **README** | PASS | README con stack, instalación, scripts, variables de entorno, sección de AI journal. | `README.md` | Bajo |
| **AI journal** | PASS | `docs/ai-notes.md` con 8 intervenciones documentadas (planificación, code review, generación de tests, fixes). Referenciado en README. | `docs/ai-notes.md`, `README.md` | Bajo |
| **Deploy** | PARTIAL | `vercel.json` configurado. Build funciona. **Variables de entorno de Vercel no configuradas**. **CORS S3 no configurado**. | `vercel.json`, `package.json` | Alto |
| **Git** | FAIL | **No hay repositorio Git inicializado**. No hay commits, ramas ni history. | N/A | Crítico |
| **Commits** | FAIL | **No existen commits**. No hay trazabilidad de cambios. | N/A | Crítico |

---

## Requisitos FAIL

| # | Requisito | Razón del fallo |
|---|-----------|-----------------|
| 1 | **Git** | No hay repositorio Git inicializado en el proyecto. `git log` falla con "not a git repository". Sin control de versiones. |
| 2 | **Commits** | Sin Git, no existen commits. No hay forma de verificar historial de cambios, revertir código, o colaborar. |

---

## Requisitos PARTIAL

| # | Requisito | Evidencia del estado parcial |
|---|-----------|------------------------------|
| 1 | **Checkout** | Formulario completo pero sin integración real de pasarela de pago. `checkoutService` simula procesamiento con delay. 2 tests fallan. |
| 2 | **S3** | Presigned URLs funcionan, pero falta configuración CORS en bucket S3 y política IAM no documentada. |
| 3 | **Security** | Firestore rules son robustos, pero `api/upload.ts` usa verificación de token simulada (no `firebase-admin` real). Faltan índices compuestos. |
| 4 | **Environment variables** | `.env` existe pero Vercel dashboard no tiene configuradas las variables de entorno necesarias para deploy. |
| 5 | **Testing** | 91% de tests pasan (361/397), pero 36 tests fallan en 11 archivos. Infrastructure tests tienen fallos estructurales de mock. |
| 6 | **Mocks** | Infraestructura de mocks existe, pero tests de Firebase/Firestore fallan por `vi.resetModules()` rompiendo `getApps()`. Algunos tests crashean por `AuthProvider` sin mock de config. |
| 7 | **Integration tests** | 6 tests de integración fallan (routing + flow). Posiblemente por mocking de auth o rutas. |
| 8 | **Deploy** | `vercel.json` y build funcionan, pero deploy real bloqueado por falta de env vars en Vercel y CORS S3. |

---

## Ordenado por impacto académico

### Crítico (bloquea aprobación)

1. **Git / Commits** — Sin repositorio Git no hay trazabilidad, ni trabajo en equipo, ni entrega formal del proyecto. Es un requisito básico de cualquier proyecto de software.

### Alto (afecta funcionalidad o seguridad)

2. **Testing** — 36 tests fallan. Aunque el 91% pasa, tests de infraestructura crítica (auth, firestore) están rotos. Esto indica que capas fundamentales no están validadas.
3. **Mocks** — Los fallos en tests de Firebase/Firestore revelan problemas arquitectónicos en la capa de mocking. `vi.resetModules()` rompe el singleton de Firebase.
4. **Security** — El endpoint de upload simula la verificación de tokens. En producción, esto es un agujero de seguridad.
5. **Environment variables** — Sin variables en Vercel, el deploy no funciona. El código está listo pero no desplegable.
6. **Deploy** — Bloqueado por env vars y CORS S3.

### Medio (afecta experiencia o completitud)

7. **Checkout** — Sin pasarela de pago real. El flujo funciona pero no procesa pagos.
8. **S3** — CORS no configurado. El upload directo fallaría en producción.
9. **Integration tests** — 6 tests fallan. Flujos completos no validados.

### Bajo (cumplido)

10. Authentication, Roles, Session persistence, Firestore, Product catalog, Category filter, Debounced search, Product detail, Cart, Context API, useReducer, Orders, Order status, Order history, Admin, CRUD, Presigned URLs, Vercel Functions, Firestore Rules, Mobile-first, Loading states, Empty states, Error states, README, AI journal.

---

## Correcciones automáticas aplicadas

### Build
- `tsconfig.json`: Agregados tipos de vitest para reconocer globals en tests.
- `tsconfig.app.json`: Actualizado para excluir `src/test` del typecheck de producción (patrón estándar).
- `package.json`: Cambiado script `build` a `tsc --noEmit -p tsconfig.app.json && vite build`.
- `src/components/ui/OrderStatusBadge.tsx`: Agregada variante `info` faltante en `colorClasses`.

### Lint
- `src/test/fixtures.ts`: Removido import unused de `CartItem`.
- `tests/integration/flow.test.tsx`: Removidos imports unused (`waitFor`, `userEvent`, `ordersService`).
- `tests/unit/admin/AdminProductsPage.test.tsx`: Removido `fireEvent` unused. Reemplazado `AuthProvider` por `AuthContext.Provider` en wrapper local. Removidos imports unused.
- `tests/unit/hooks/useCart.test.tsx`: Removidos imports unused (`CartContext`, `CartContextValue`).
- `tests/unit/pages/CatalogPage.test.tsx`: Removido `userEvent` unused.
- `tests/unit/admin/AdminProductFormPage.test.tsx`: Reemplazado `import()` type annotation por `import type * as ReactRouterDom`.
- `tests/unit/api/upload.test.ts`: Removida interfaz unused. Agregado `setHeader` a mock de VercelResponse. Eliminados casts `as any`.

### Tests
- `src/test/renderWithProviders.tsx`: Fix de wrapper anidado (`AuthProvider` dentro de `AuthContext.Provider` causaba override del mock).
- `tests/unit/components/AdminProductsPage.test.tsx`: Cambiado wrapper de `AuthProvider` a `AuthContext.Provider` con `mockAuthValue`. Corregido encoding de `Confirmar eliminación`.
- `tests/unit/components/Checkout.test.tsx`: Cambiado wrapper de `AuthProvider` a `AuthContext.Provider` con `mockUseAuth` tipado. Corregidos textos con encoding.
- `tests/unit/components/Cart.test.tsx`: Removido wrapper innecesario de `AuthProvider` (causaba crash por Firebase config missing).
- `src/types/ui.ts`: Corregidos caracteres con encoding doble (`está`, `vacío`, `catálogo`, `órdenes`, `búsqueda`, `inválidos`).
- `src/pages/admin/ProductsPage.tsx`: Corregido `Confirmar eliminación`.
- `docs/production-checklist.md`: Corregido encoding.

### Resultado de comandos post-fix

| Comando | Antes | Después |
|---------|-------|---------|
| `npm run build` | ❌ 4 errores TS + 25 errores lint | ✅ 0 errores |
| `npm run lint` | ❌ 25 errores | ✅ 0 errores |
| `npm run test` | ⚠️ 53 fallos / 397 tests | ⚠️ 36 fallos / 397 tests (mejorado de 53 a 36) |

---

## Checklist final

### Bloqueantes (deben resolverse para aprobar)

- [ ] **Git**: Inicializar repositorio Git, hacer commit inicial, configurar `.gitignore`.
- [ ] **Testing**: Investigar y corregir los 36 tests fallantes restantes (principalmente `auth.test.ts`, `firestore.test.ts`, integration tests).
- [ ] **Mocks**: Revisar arquitectura de mocks de Firebase. `vi.resetModules()` en `setup.ts` rompe `getApps()`. Considerar eliminar `vi.resetModules()` o reestructurar mocks.
- [ ] **Security**: Reemplazar verificación simulada de Firebase token en `api/upload.ts` por `firebase-admin` real.

### Altos (deberían resolverse)

- [ ] **Environment variables**: Configurar todas las variables en Vercel dashboard (`VITE_FIREBASE_*`, `AWS_*`).
- [ ] **Deploy**: Configurar CORS en bucket S3. Documentar política IAM.
- [ ] **Firestore indexes**: Crear `firestore.indexes.json` con índices compuestos para queries `where` + `orderBy`.
- [ ] **Integration tests**: Corregir 6 tests de integración fallidos (app-routing, components, flow).

### Medios (mejoran completitud)

- [ ] **Checkout**: Integrar pasarela de pago real (Stripe, PayPal, etc.) o documentar que es simulada.
- [ ] **S3**: Configurar CORS en bucket S3 para permitir PUT desde dominio frontend.
- [ ] **Error boundaries**: Agregar React Error Boundary en `App.tsx` para capturar crashes.

### Bajos (deseables)

- [ ] **Monitoring**: Agregar Sentry o similar para error tracking en producción.
- [ ] **Rate limiting**: En `/api/upload` para prevenir abuso.
- [ ] **Backup Firestore**: Configurar export automático de backups.
- [ ] **CI/CD**: Configurar pipeline que ejecute `build`, `lint`, `test` y falle si cualquiera falla.

---

*Generado por Kilo — Auditoría Proyecto Integrador 5 — 16/8/2026*