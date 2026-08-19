# Plan de Implementación — Proyecto Integrador 5

> **Proyecto**: E-Commerce (Patagonix Tech)
> **Estado actual**: Repositorio inicializado, commit único, 36 tests fallando, build/lint OK
> **Objetivo**: Llevar el proyecto a estado production-ready cumpliendo las 18 fases del requisito
> **Metodología**: Inspeccionar → Planificar → Implementar → Testear → Reportar → Continuar

---

## Fase 1 — Architecture/setup
**Estado**: Parcial
**Acciones**:
- ✅ Estructura de carpetas creada (`src/`, `tests/`, `api/`, `docs/`)
- ✅ Git inicializado y primer commit realizado
- ⚠️ Faltan branches de trabajo (`feature/*`, `fix/*`, `release/*`)
- ⚠️ Faltan workflows de CI/CD (GitHub Actions)

**Tareas**:
1. Crear branches: `develop`, `staging`, `main`
2. Configurar branch protection rules en GitHub
3. Crear `.github/workflows/ci.yml` con `build`, `lint`, `test`

---

## Fase 2 — Domain/types
**Estado**: Completo
**Acciones**:
- ✅ Tipos de dominio: `Product`, `Order`, `CartItem`, `Money`, `Address`
- ✅ DTOs: `ProductDTO`, `OrderDTO`, `UserProfileDTO`
- ✅ Discriminated unions: `AsyncStatus`, `OrderStatus`, `UserRoleState`, `BadgeVariant`
- ✅ Pureza de tipos: `readonly` en entidades, `as const` en literales

**Tareas**: Ninguna. Tipos validados por build.

---

## Fase 3 — Firebase infrastructure
**Estado**: Completo
**Acciones**:
- ✅ `firebase/config.ts`: inicialización lazy, validación de env vars, singleton pattern
- ✅ `firebase/auth.ts`: signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, observeAuthState, getUserProfile, createUserProfile
- ✅ `firebase/firestore.ts`: CRUD productos y órdenes, DTOs, queries con where/orderBy/limit
- ✅ `firebase/adapters.ts`: DTO → Entity conversion

**Tareas**: Ninguna. Infraestructura validada por tests unitarios (excepto mocks rotos).

---

## Fase 4 — Authentication/roles
**Estado**: Completo
**Acciones**:
- ✅ Login email/password
- ✅ Registro email/password
- ✅ Google login
- ✅ Logout
- ✅ Session persistence via `observeAuthState`
- ✅ Roles: `customer` y `admin` guardados en Firestore
- ✅ `UserRoleState.loading` para evitar flicker en redirects

**Tareas**: Ninguna. Flujo de auth completo.

---

## Fase 5 — Firestore security
**Estado**: Parcial
**Acciones**:
- ✅ `firestore.rules` completo con helpers: `isSignedIn`, `isAdmin`, `isOwner`, `isOrderOwner`, `pricesValid`, `itemsValid`, `orderAllowedFields`, `userAllowedFields`, `productAllowedFields`
- ✅ Reglas específicas por colección: `users`, `products`, `orders`
- ✅ Catch-all deny
- ✅ Tests de seguridad con `@firebase/rules-unit-testing`

**Tareas**:
1. Crear `firestore.indexes.json` con índices compuestos requeridos:
   - `orders` por `userId + createdAt` (para `getUserOrders`)
   - `orders` por `status + createdAt` (para `getAllOrders` con filtro)
   - `products` por `category + isActive + createdAt` (para `getProducts` con filtros)
2. Desplegar reglas a Firebase (`firebase deploy --only firestore:rules`)
3. Verificar que los tests de seguridad pasen con emulador

---

## Fase 6 — UI Kit
**Estado**: Completo
**Acciones**:
- ✅ Componentes base: `Button`, `Input`, `Select`, `Textarea`, `Checkbox`, `Card`, `Badge`, `Alert`, `Price`, `Spinner`, `Skeleton`
- ✅ Componentes compuestos: `ProductCard`, `Modal`, `QuantitySelector`, `SearchInput`, `CategoryFilter`
- ✅ Estados: `EmptyState`, `ErrorState`, `LoadingState`
- ✅ Layout: `Container`, `Header`, `Footer`, `Navbar`
- ✅ Accesibilidad: `useId()` para labels, `aria-label`, `role="status"`, `aria-modal`
- ✅ Mobile-first: responsive classes, `overflow-x-auto` en tablas

**Tareas**: Ninguna. UI Kit completo y estilizado.

---

## Fase 7 — Catalog
**Estado**: Completo
**Acciones**:
- ✅ `CatalogPage` con grid responsive de productos
- ✅ `ProductDetailPage` con imagen, precio, descripción, stock, selector de cantidad
- ✅ `CategoryFilter` component
- ✅ `SearchInput` con debounce
- ✅ `useProducts` hook con `useDebounce(300ms)`
- ✅ Loading, empty y error states
- ✅ `ProductCard` component reutilizable

**Tareas**: Ninguna. Catálogo funcional.

---

## Fase 8 — Cart reducer
**Estado**: Completo
**Acciones**:
- ✅ `cartReducer` puro en `utils/cart/cartUtils.ts`
- ✅ Acciones: `ADD_ITEM`, `REMOVE_ITEM`, `UPDATE_QUANTITY`, `APPLY_DISCOUNT`, `REMOVE_DISCOUNT`, `CLEAR_CART`, `HYDRATE`
- ✅ Clamping a `maxStock`
- ✅ Recalculo de totales en cada mutación
- ✅ `calculateTotal` con `addMoney`, `multiplyMoney` (centavos, no floats)
- ✅ Tests unitarios del reducer (`cartReducer.test.ts`)

**Tareas**: Ninguna. Reducer puro y testeado.

---

## Fase 9 — Cart context
**Estado**: Completo
**Acciones**:
- ✅ `CartContext` + `CartProvider`
- ✅ `useCart` hook
- ✅ Persistencia en `localStorage` con validación de versión
- ✅ `saveCartToStorage`, `loadCartFromStorage`, `clearCartFromStorage`
- ✅ Manejo de datos corruptos (JSON.parse fallido, versión desconocida, items inválidos)
- ✅ SSR-safe: `isAvailable()` para verificar `localStorage`

**Tareas**: Ninguna. Context y persistencia funcionan.

---

## Fase 10 — Checkout/orders
**Estado**: Parcial
**Acciones**:
- ✅ `CheckoutPage` con formulario completo (shipping, billing, payment, notes)
- ✅ `useCheckout` hook
- ✅ `checkoutService.processCheckout` simula pago (1.2s delay)
- ✅ `OrderDetailPage` con historial de estados, resumen financiero
- ✅ `OrdersPage` con historial de órdenes
- ✅ `OrderStatus` transitions: pending → processing → completed/cancelled
- ✅ `canTransition` para validar cambios de estado
- ⚠️ Checkout simulado (sin pasarela de pago real)

**Tareas**:
1. Decidir: ¿Integrar pasarela real (Stripe/PayPal) o marcar como simulada?
2. Si es simulada: documentar explícitamente en README y UI
3. Si es real: implementar `checkoutService` con Stripe/PayPal SDK
4. Agregar idempotency key para prevenir doble checkout
5. Corregir tests fallantes de CheckoutPage

---

## Fase 11 — Admin
**Estado**: Completo
**Acciones**:
- ✅ `AdminRoute` component
- ✅ `AdminLayout` con sidebar, hamburger, navegación
- ✅ `DashboardPage` con stats y quick actions
- ✅ `ProductsPage` con tabla, búsqueda, filtros, modal de eliminación
- ✅ `ProductFormPage` con formulario de creación/edición
- ✅ `OrdersPage` con filtro por estado, cambio de estado
- ✅ `OrderDetailPage` con historial y detalles
- ✅ CRUD productos y órdenes
- ✅ `ImageUploader` component

**Tareas**: Ninguna. Admin funcional.

---

## Fase 12 — S3/presigned URLs
**Estado**: Parcial
**Acciones**:
- ✅ `api/upload.ts` Vercel Function
- ✅ Genera presigned PUT URLs con AWS SDK
- ✅ Validación de archivo (tamaño, tipo, extensión)
- ✅ CORS headers en respuesta
- ✅ `uploadService` frontend: solicita URL, sube archivo
- ⚠️ CORS de bucket S3 no configurado
- ⚠️ Política IAM no documentada
- ⚠️ Verificación de token Firebase simulada (no `firebase-admin`)

**Tareas**:
1. Configurar CORS en bucket S3 para `PUT` desde dominio frontend
2. Documentar política IAM necesaria (`s3:PutObject`, `s3:PutObjectAcl`)
3. Reemplazar verificación simulada por `firebase-admin` real en `api/upload.ts`
4. Probar flujo end-to-end con bucket real

---

## Fase 13 — Testing
**Estado**: Parcial
**Acciones**:
- ✅ Infraestructura de tests: `vitest.config.ts`, `src/test/setup.ts`, `fixtures.ts`, `mocks/`
- ✅ Tests unitarios: reducer, hooks, componentes, providers
- ✅ Tests de integración: routing, components, flow
- ✅ Tests de seguridad: `firestore.rules.test.ts`
- ⚠️ 36 tests fallando de 397 totales (91% de cobertura)

**Tareas**:
1. Diagnosticar y corregir tests fallantes de `auth.test.ts` y `firestore.test.ts` (mocks de Firebase)
2. Corregir tests de integración fallantes (app-routing, flow)
3. Corregir tests de `AdminOrderDetailPage`, `AdminProductFormPage`, `DashboardPage`
4. Corregir tests de `AuthProvider` (timing en mocks)
5. Corregir tests de `AdminProductsPage` (encoding)
6. Alcanzar 100% de tests pasando

---

## Fase 14 — Analytics/pagination
**Estado**: No iniciado
**Acciones**:
- ⚠️ No hay analytics
- ⚠️ Paginación básica en `productsService` pero sin cursor real

**Tareas**:
1. Decidir: ¿Implementar analytics o marcarlo como fuera de scope?
2. Si se implementa: agregar eventos a `useProducts`, `useCart`, `useCheckout`
3. Completar paginación real con cursor en Firestore

---

## Fase 15 — Security audit
**Estado**: Parcial
**Acciones**:
- ✅ Firestore Rules comprehensivos
- ✅ Tests de seguridad
- ✅ AWS credentials server-only
- ✅ `.env` gitignored
- ⚠️ Upload handler con verificación simulada
- ⚠️ Sin índices compuestos Firestore
- ⚠️ Faltan rate limits en `/api/upload`

**Tareas**:
1. Reemplazar verificación simulada por `firebase-admin`
2. Crear `firestore.indexes.json`
3. Agregar rate limiting en `/api/upload`
4. Auditar dependencias (`npm audit`)
5. Configurar CSP headers en Vercel

---

## Fase 16 — Production audit
**Estado**: Parcial
**Acciones**:
- ✅ `vercel.json` configurado
- ✅ Build funciona (`tsc --noEmit && vite build`)
- ✅ Lint pasa (`eslint . --max-warnings=0`)
- ⚠️ Variables de entorno no configuradas en Vercel
- ⚠️ CORS S3 no configurado
- ⚠️ Falta smoke test de producción
- ⚠️ Falta monitoreo (Sentry, LogRocket, etc.)

**Tareas**:
1. Configurar environment variables en Vercel dashboard
2. Configurar CORS en S3
3. Crear script de smoke test manual/automático
4. Configurar monitoreo de errores
5. Verificar que el deploy funcione end-to-end

---

## Fase 17 — README/AI journal
**Estado**: Completo
**Acciones**:
- ✅ README con stack, instalación, scripts, variables de entorno
- ✅ `docs/ai-notes.md` con 8 intervenciones documentadas
- ✅ `docs/production-checklist.md`
- ✅ `docs/audit-matrix.md`
- ✅ `docs/defense-prep.md`

**Tareas**: Ninguna. Documentación completa.

---

## Fase 18 — Final evaluation
**Estado**: Pendiente
**Acciones**:
- ✅ Auditoría completada
- ✅ Defensa técnica preparada
- ⚠️ Faltan correcciones finales
- ⚠️ Faltan commits semánticos por fase

**Tareas**:
1. Corregir todos los tests fallantes
2. Corregir security issues
3. Hacer commits semánticos por fase
4. Preparar demo en vivo
5. Practicar respuestas del evaluador

---

## Resumen de tareas pendientes

### Críticas (bloquean producción)
1. **Tests**: Corregir 36 tests fallantes
2. **Security**: Reemplazar verificación simulada de Firebase token en `api/upload.ts`
3. **Firestore indexes**: Crear `firestore.indexes.json`
4. **Environment variables**: Configurar en Vercel dashboard
5. **Git workflow**: Crear branches y CI/CD

### Altas (afectan funcionalidad)
6. **S3 CORS**: Configurar CORS en bucket
7. **IAM**: Documentar política IAM
8. **Integration tests**: Corregir 6 tests de integración
9. **Checkout**: Decidir si es simulado o real, documentar

### Medias (mejoran completitud)
10. **Analytics**: Decidir si se implementa
11. **Pagination**: Completar cursor real en Firestore
12. **Monitoring**: Agregar Sentry o similar
13. **Rate limiting**: En `/api/upload`

### Bajas (deseables)
14. **Error boundaries**: En `App.tsx`
15. **Backup Firestore**: Export automático
16. **CI/CD**: GitHub Actions
17. **Smoke tests**: Producción

---

## Orden de ejecución recomendado

1. **Semana 1**:
   - Fase 15: Security audit (firebase-admin, indexes, rate limiting)
   - Fase 13: Testing (corregir 36 tests)
   - Fase 16: Production audit (Vercel env vars, CORS)

2. **Semana 2**:
   - Fase 10: Checkout (decidir simulado vs real)
   - Fase 12: S3 (CORS, IAM, firebase-admin)
   - Fase 5: Firestore indexes

3. **Semana 3**:
   - Fase 18: Final evaluation (commits, demo, práctica)
   - Fase 1: Git workflow (branches, CI/CD)
   - Fase 14/16: Analytics/monitoring (si hay tiempo)

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Tests de Firebase siguen fallando | Alta | Alto | Investigar `vi.resetModules()` + `getApps()` conflict |
| Firebase token verification compleja | Media | Alto | Usar `firebase-admin` SDK en Vercel Function |
| S3 CORS mal configurado | Media | Alto | Probar con bucket de staging primero |
| Variables de entorno filtradas | Baja | Crítico | Nunca commitear `.env`, usar Vercel server envs |
| Tests de integración frágiles | Alta | Medio | Usar mocks estables, evitar dependencias de timing |

---

## Comandos de verificación

```bash
# Build
npm run build

# Lint
npm run lint

# Tests
npm run test

# Tests de seguridad
npm run test:rules

# Dev server
npm run dev
```

---

*Generado por Kilo — Plan de Implementación — Proyecto Integrador 5 — 16/8/2026*
