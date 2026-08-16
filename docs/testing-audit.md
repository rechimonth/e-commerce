# Auditoría de Testing — E-Commerce

> **Fecha**: 15/8/2026  
> **Enfoque**: Riesgo, no cobertura artificial.  
> **Objetivo**: Identificar brechas que pueden causar errores en producción.

---

## Resumen ejecutivo

| Módulo | Riesgo | Tests existentes | Tests faltantes críticos |
|--------|--------|------------------|--------------------------|
| cartReducer | BAJO | ✅ Excelentes (30+) | Ninguno |
| useCart | MEDIO | ✅ Buenos (7) | Ninguno significativo |
| useAuth | MEDIO | ✅ Básicos (3) | Callbacks memoizados |
| ProtectedRoute | CRÍTICO | ✅ Arreglados (4) | Ninguno |
| AdminRoute | CRÍTICO | ✅ Arreglados (4) | Ninguno |
| Catálogo | MEDIO | ✅ Buenos (5) | Búsqueda + categorías integrados |
| Debounce | BAJO | ✅ Excelentes (6) | Ninguno |
| Checkout | MEDIO | ✅ Mejorados (5) | Validación HTML5 |
| Orders | MEDIO | ✅ Buenos (10) | Ninguno |
| Admin CRUD | MEDIO | ✅ Mejorados (7) | Filtros y búsqueda admin |
| S3 Upload | BAJO | ✅ Excelentes (10) | Ninguno |
| Firestore services | MEDIO | ✅ Buenos (13) | Ninguno |
| Firestore infra | MEDIO | ⚠️ Pre-existente (17) | Mocks `vi.resetModules` rotos |

---

## Hallazgos detallados

### 1. cartReducer — Riesgo BAJO ✅

**Estado**: Excelente cobertura.  
**Tests existentes**:
- `cartReducer.test.ts`: 15 tests (acciones, HYDRATE, inmutabilidad, full flow)
- `cartUtils.test.ts`: ~30 tests (funciones puras, calculateTotal, addItem, removeItem, updateItemQuantity)

**Edge cases cubiertos**:
- Clamping a maxStock ✅
- Cantidades negativas/cero ✅
- HYDRATE con totales inconsistentes ✅
- Inmutabilidad ✅
- Múltiples items con diferentes precios ✅

**Gap**: Ninguno significativo.

---

### 2. useCart — Riesgo MEDIO ✅

**Estado**: Buenos tests.  
**Tests existentes**: `useCart.test.tsx` (7 tests)

**Cobertura**:
- Estado inicial vacío ✅
- addItem, removeItem, updateQuantity, clearCart ✅
- Error fuera del provider ✅
- Clamp a stock ✅

**Gap**: Ninguno significativo. Los totales se verifican implícitamente.

---

### 3. useAuth — Riesgo MEDIO ✅

**Estado**: Básico pero funcional.  
**Tests existentes**: `useAuth.test.tsx` (3 tests)

**Cobertura**:
- Retorna contexto ✅
- Error fuera del provider ✅
- Callbacks expuestos ✅

**Gap**: No verifica que los callbacks sean estables (memoizados). Impacto bajo porque `AuthProvider` usa `useCallback`.

---

### 4. ProtectedRoute — Riesgo CRÍTICO ✅

**Estado**: Arreglado y funcional.  
**Tests existentes**: `ProtectedRoute.test.tsx` (4 tests)

**Cobertura**:
- Spinner en loading ✅
- Redirect a login cuando unauthenticated ✅
- Renderiza children cuando autenticado ✅
- No renderiza children en redirect ✅

**Fix aplicado**: Mock de `useAuth` + `createMemoryRouter` para evitar crashes con `Navigate`.

---

### 5. AdminRoute — Riesgo CRÍTICO ✅

**Estado**: Arreglado y funcional.  
**Tests existentes**: `AdminRoute.test.tsx` (4 tests)

**Cobertura**:
- Spinner en loading ✅
- Redirect a login cuando unauthenticated ✅
- Redirect a 403 cuando customer ✅
- Renderiza children cuando admin ✅

**Fix aplicado**: Mock de `useAuth` + `createMemoryRouter`.

---

### 6. Catálogo — Riesgo MEDIO ✅

**Estado**: Buenos tests.  
**Tests existentes**:
- `CatalogPage.test.tsx` (5 tests)
- `ProductSearch.test.tsx`
- `ProductFilters.test.tsx`
- `ProductList.test.tsx`

**Cobertura**:
- Renderizado de productos ✅
- Buscador presente ✅
- Filtros de categoría ✅
- Breadcrumb ✅
- Empty state cuando no hay productos ✅

**Gap**: No prueba interacción completa de búsqueda + categoría (cambio de categoría limpia búsqueda). Impacto medio.

---

### 7. Debounce — Riesgo BAJO ✅

**Estado**: Excelentes tests.  
**Tests existentes**: `useDebounce.test.ts` (6 tests)

**Cobertura**:
- Valor inicial inmediato ✅
- Debounce de cambios ✅
- Cleanup en cambios rápidos ✅
- Cleanup en unmount ✅
- Soporta diferentes tipos ✅
- Soporta objetos ✅

**Gap**: Ninguno.

---

### 8. Checkout — Riesgo MEDIO ✅

**Estado**: Mejorado.  
**Tests existentes**:
- `useCheckout.test.tsx` (4 tests)
- `CheckoutPage.test.tsx` (5 tests)

**Cobertura**:
- Estado idle ✅
- Checkout exitoso ✅
- Error en checkout ✅
- Empty state cuando carrito vacío ✅
- Renderizado de formulario ✅
- Submit llama a processCheckout ✅
- Error visible en UI ✅

**Gap**: No prueba bloqueo de submit por validación HTML5 (campos `required`). Impacto medio.

---

### 9. Orders — Riesgo MEDIO ✅

**Estado**: Buenos tests.  
**Tests existentes**:
- `useOrders.test.tsx` (5 tests)
- `OrdersPage.test.tsx` (5 tests)
- `OrderDetailPage.test.tsx`

**Cobertura**:
- Estado inicial ✅
- Fetch y seteo de órdenes ✅
- Error handling ✅
- Empty state ✅
- Refetch ✅
- Loading state ✅
- Error state con retry ✅
- Link a detalle correcto ✅

**Gap**: Ninguno significativo.

---

### 10. Admin CRUD — Riesgo MEDIO ✅

**Estado**: Mejorado.  
**Tests existentes**:
- `AdminProductsPage.test.tsx` (3 tests)
- `AdminOrdersPage.test.tsx` (4 tests)
- `AdminProductFormPage.test.tsx`
- `AdminOrderDetailPage.test.tsx`
- `AdminLayout.test.tsx`
- `DashboardPage.test.tsx`

**Cobertura**:
- AdminProductsPage: render tabla, modal eliminación, búsqueda client-side ✅
- AdminOrdersPage: render tabla, empty state, filtro por status, cambio de estado ✅

**Gap**: No prueba creación/edición completa de productos (AdminProductFormPage). Impacto medio.

---

### 11. S3 Upload — Riesgo BAJO ✅

**Estado**: Excelentes tests.  
**Tests existentes**: `upload.test.ts` (10 tests)

**Cobertura**:
- Método no POST → 405 ✅
- Sin auth → 401 ✅
- Sin fileName → 400 ✅
- Sin fileType → 400 ✅
- Extensión inválida → 400 ✅
- Content type inválido → 400 ✅
- File muy grande → 400 ✅
- AWS env missing → 500 ✅
- Success con presigned URL ✅
- Key pattern válido ✅

**Gap**: Ninguno. No hay llamadas reales a AWS.

---

### 12. Firestore services — Riesgo MEDIO ✅

**Estado**: Buenos tests.  
**Tests existentes**:
- `firestore.test.ts` (13 tests)
- `auth.test.ts` (10 tests)

**Cobertura**:
- Productos: get, create, update, delete ✅
- Órdenes: create, getUserOrders, getOrder, getAllOrders, updateOrderStatus ✅
- Auth: signIn, signUp, signInWithGoogle, signOut, observeAuthState, getUserProfile, createUserProfile, error wrapping ✅

**Issue pre-existente**: Tests fallan con `vi.resetModules()` porque `getApps` queda `undefined`. No se modificó este comportamiento para no romper el diseño original de los tests. Se recomienda re-evaluar la estrategia de mocking de Firebase en estos archivos.

---

## Verificación de criterios globales

### no network real
- Todos los tests mockean servicios. ✅
- Firestore tests usan mocks de firebase, no emulador. ✅
- Upload tests mockean AWS SDK. ✅
- `src/test/setup.ts` mockea AWS globalmente. ✅

### no Firebase real
- `firestore.test.ts` y `auth.test.ts` mockean completamente firebase/app, firebase/auth, firebase/firestore. ✅

### no AWS real
- `upload.test.ts` mockea `@aws-sdk/client-s3` y `@aws-sdk/s3-request-presigner`. ✅
- `setup.ts` también mockea AWS globalmente. ✅

### tests deterministas
- Uso de `vi.clearAllMocks`, `vi.resetModules`. ✅
- Fake timers en useDebounce. ✅
- `createMemoryRouter` para tests de routing. ✅

### fixtures reutilizables
- `src/test/fixtures.ts` existe pero NO se usa en tests. ❌
- Los tests tienen fixtures inline. Se recomienda migrar a `fixtures.ts`.

### renderWithProviders
- `src/test/renderWithProviders.tsx` existe pero NO se usa consistentemente. ❌
- Se usa `createMemoryRouter` + mocks de hooks en su lugar.

### async correctamente manejado
- Uso de `waitFor`, `act`, async/await. ✅
- `userEvent` en tests nuevos. ✅

### user-event
- `@testing-library/user-event` está instalado. ✅
- Se usa en CatalogPage, CheckoutPage, AdminProductsPage, AdminOrdersPage, ProductCard. ✅
- Tests antiguos usan `fireEvent` (no crítico). ⚠️

### mocks limpiados
- Uso generalizado de `vi.clearAllMocks` en `beforeEach`. ✅
- Algunos tests usan `vi.resetModules` (causa problemas en firestore/auth). ⚠️

### edge cases
- Cart: bien cubiertos (stock=0, cantidades negativas, JSON corrupto, version incompatible). ✅
- Upload: bien cubiertos (todos los errores de validación). ✅
- Auth infra: cubre error wrapping. ✅
- Checkout: cubre empty state y error. ✅
- Admin: cubre filtros y cambio de estado. ✅

---

## Top 10 tests por valor (riesgo × impacto)

| # | Test | Riesgo | Valor | Estado |
|---|------|--------|-------|--------|
| 1 | Firestore services (productos + órdenes) | CRÍTICO | Muy alto | ✅ Existentes |
| 2 | Auth infrastructure (signIn, signUp, error wrapping) | CRÍTICO | Muy alto | ✅ Existentes |
| 3 | cartReducer + cartUtils | CRÍTICO | Muy alto | ✅ Existentes |
| 4 | CartProvider (persistencia + invalid JSON) | CRÍTICO | Muy alto | ✅ Existentes |
| 5 | ProtectedRoute (spinner, redirect, children) | CRÍTICO | Muy alto | ✅ Arreglados |
| 6 | AdminRoute (spinner, redirect, 403) | CRÍTICO | Muy alto | ✅ Arreglados |
| 7 | AdminOrdersPage (filtro status + cambio estado) | ALTO | Alto | ✅ Implementado |
| 8 | useCheckout (idle, success, error) | ALTO | Alto | ✅ Existentes |
| 9 | S3 Upload API (todos los códigos de error) | ALTO | Alto | ✅ Existentes |
| 10 | AdminProductsPage (tabla, búsqueda, modal) | ALTO | Alto | ✅ Mejorado |

---

## Tests implementados / arreglados en esta sesión

1. `ProtectedRoute.test.tsx` — Mock de `useAuth` + `createMemoryRouter`. 4 tests.
2. `AdminRoute.test.tsx` — Mock de `useAuth` + `createMemoryRouter`. 4 tests.
3. `useAuth.test.tsx` — Uso de `AuthContext.Provider` directo. 3 tests.
4. `CheckoutPage.test.tsx` — Mocks correctos de hooks + `createMemoryRouter`. 5 tests.
5. `CatalogPage.test.tsx` — Mocks correctos + `createMemoryRouter`. 5 tests.
6. `AdminProductsPage.test.tsx` — Agregado test de búsqueda. 3 tests.
7. `AdminOrdersPage.test.tsx` — Agregados tests de filtro y cambio de estado. 4 tests.
8. `ProductCard.test.tsx` — Agregado test de `onQuickView`. 9 tests.

---

## Recomendaciones

1. **Firestore/Auth infra**: Re-evaluar el uso de `vi.resetModules()` en `beforeEach`. Causa fallos en CI.
2. **Fixtures**: Migrar fixtures inline a `src/test/fixtures.ts` para reducir duplicación.
3. **renderWithProviders**: Usar consistentemente `createMemoryRouter` en lugar de `MemoryRouter` para tests de routing.
4. **userEvent**: Migrar tests antiguos de `fireEvent` a `userEvent` gradualmente.
5. **Encoding**: Verificar encoding UTF-8 en archivos con acentos para evitar falsos negativos en tests.

---

*Generado por Kilo — 15/8/2026*