# Plan: Corrección de Tests, Mocks y Top 10 Problemas

**Fecha**: 2026-08-18  
**Estado**: Listo para implementación  
**Alcance**: No modificar lógica de producción; solo tests, mocks y configuraciones.

---

## 1. Eliminación de carpeta "final"

- **Estado**: No existe. La única coincidencia encontrada fue dentro de comentarios en `node_modules` (AWS SDK), no una carpeta del proyecto.
- **Acción**: Ninguna requerida.

---

## 2. Top 10 problemas identificados

| # | Problema | Archivos afectados | Tipo |
|---|----------|-------------------|------|
| 1 | Tests con `AuthProvider` sin mocks de Firebase | Cart.test.tsx, Checkout.test.tsx, flow.test.tsx, AdminOrdersPage.test.tsx, AdminOrderDetailPage.test.tsx, AdminProductFormPage.test.tsx, AdminLayout.test.tsx, admin-routing.test.tsx | Mock roto |
| 2 | Props inválidos en ProductCard.test.tsx | ProductCard.test.tsx | Test roto |
| 3 | Formato de moneda frágil en jsdom | StructuralComponents.test.tsx, ProductCard.test.tsx, Cart.test.tsx | Test roto |
| 4 | `vi.spyOn` sobre funciones mockeadas en AdminProductsPage | AdminProductsPage.test.tsx | Mock roto |
| 5 | `observeAuthState` sin retorno en AuthProvider.test.tsx | AuthProvider.test.tsx | Mock roto |
| 6 | `checkoutService` no usa `ordersService.createOrder` | checkoutService.ts, ordersService.ts | Arquitectura |
| 7 | `getUserOrders` sin soporte de `limit` | firestore.ts | Feature missing |
| 8 | `useOrders` estado inicial inconsistente | useOrders.ts | Bug menor |
| 9 | `CartContext` no expone `discount` | CartContext.ts, CartProvider.tsx | Inconsistencia |
| 10 | `AdminOrderDetailPage` texto "Informaciónón" con tilde doble | AdminOrderDetailPage.tsx | Typo |

---

## 3. Plan de implementación

### 3.1 Agregar mocks de Firebase a tests que usan `AuthProvider`

Para cada archivo listado en problema #1, agregar bloques `vi.mock` locales para:
- `@/infrastructure/firebase/config`
- `@/infrastructure/firebase/auth`

Patrón recomendado:
```ts
vi.mock('@/infrastructure/firebase/config', () => ({
  getFirebaseDb: vi.fn(() => ({ _type: 'Firestore' })),
  firebaseTryCatch: async (fn: () => Promise<unknown>) => fn(),
  _resetFirebaseForTesting: vi.fn(),
  initializeFirebase: vi.fn(),
}));

vi.mock('@/infrastructure/firebase/auth', () => ({
  observeAuthState: vi.fn(() => vi.fn()),
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
  getUserProfile: vi.fn(),
}));
```

**Archivos a modificar**:
- `tests/unit/components/Cart.test.tsx`
- `tests/unit/components/Checkout.test.tsx`
- `tests/integration/flow.test.tsx`
- `tests/unit/admin/AdminOrdersPage.test.tsx`
- `tests/unit/admin/AdminOrderDetailPage.test.tsx`
- `tests/unit/admin/AdminProductFormPage.test.tsx`
- `tests/unit/admin/AdminLayout.test.tsx`
- `tests/unit/admin/admin-routing.test.tsx`

### 3.2 Corregir ProductCard.test.tsx

- Eliminar props inexistentes: `description`, `imageKey`, `isActive`.
- Cambiar aserción de precio de `$19.99` a regex `/19\.99/` para evitar problemas de `Intl` en jsdom.

### 3.3 Corregir aserciones de formato de moneda

- En `StructuralComponents.test.tsx`: cambiar `$29.99` por `/29\.99/`, `129,99 €` por `/129.*99/`.
- En `Cart.test.tsx`: cambiar `String.fromCharCode(36) + '39.98'` por `/39\.98/`.

### 3.4 Corregir AdminProductsPage.test.tsx

- Reemplazar `vi.spyOn(productsService, 'fetchProductsAdmin')` por acceso directo al mock:
  ```ts
  const { fetchProductsAdmin } = await import('@/services/productsService');
  (fetchProductsAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(...);
  ```
- Hacer lo mismo para `deleteProduct`.

### 3.5 Corregir AuthProvider.test.tsx

- Asegurar que `observeAuthState` devuelva `mockUnsubscribe`:
  ```ts
  vi.mocked(observeAuthState).mockReturnValue(mockUnsubscribe);
  ```

### 3.6 Integrar `ordersService.createOrder` en `checkoutService`

- Agregar `createOrder` a `ordersService.ts` que envuelva `firestoreCreateOrder` y aplique `toOrder`.
- Modificar `checkoutService.ts` para usar `ordersService.createOrder`.
- Ajustar tests de `useCheckout` y `CheckoutPage` si es necesario.

### 3.7 Corregir `useOrders` estado inicial

- `useOrders` comienza en `loading` aunque `userId` esté vacío.
- Cambiar estado inicial a `idle` cuando `userId` esté vacío.

### 3.8 Corregir `CartContext` para exponer `discount`

- Agregar `discount` al valor del contexto para consistencia con `CartState`.

### 3.9 Corregir typo en `AdminOrderDetailPage`

- Eliminar tilde doble en "Informaciónón" → "Información".

---

## 4. Validación

```bash
# 1. Build
npm run build

# 2. Lint
npm run lint

# 3. Tests
npm run test -- --run

# 4. Coverage (opcional)
npm run test:coverage
```

**Criterio de éxito**: 0 tests fallidos, 0 errores de lint, build exitoso.

---

## 5. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Mocks de Firebase conflictúan entre tests | Media | Alto | Usar mocks locales por archivo, no globales |
| Formato de moneda varía entre entornos | Media | Medio | Usar regex en aserciones en lugar de strings exactos |
| `vi.spyOn` falla con mocks factory | Alta | Medio | Reemplazar por acceso directo al mock |
| Cambios en checkout rompen flujo existente | Baja | Alto | Mantener misma firma de `processCheckout` |

---

## 6. Checklist de implementación

- [ ] 3.1 — Agregar mocks Firebase a 8 archivos de test
- [ ] 3.2 — Corregir ProductCard.test.tsx
- [ ] 3.3 — Corregir aserciones de moneda (2 archivos)
- [ ] 3.4 — Corregir AdminProductsPage.test.tsx
- [ ] 3.5 — Corregir AuthProvider.test.tsx
- [ ] 3.6 — Integrar createOrder en checkoutService
- [ ] 3.7 — Corregir useOrders estado inicial
- [ ] 3.8 — Exponer discount en CartContext
- [ ] 3.9 — Corregir typo AdminOrderDetailPage
- [ ] 4 — Ejecutar validación completa
