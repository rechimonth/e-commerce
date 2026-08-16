# Plan: P0 — Checkout debe crear orden en Firestore

**Prompt**: P0 — CRÍTICO  
**Archivo objetivo**: `src/services/checkoutService.ts`  
**Archivos relacionados**: `src/services/ordersService.ts`, `src/infrastructure/firebase/firestore.ts`  
**Fecha**: 16/8/2026

---

## Problema actual

`checkoutService.processCheckout` simula el pago con `setTimeout` y devuelve una orden en memoria. No persiste en Firestore.

## Cambios obligatorios

1. **Agregar `createOrder` en `ordersService.ts`**
   - Importar `createOrder` desde `@/infrastructure/firebase/firestore`.
   - Crear método público `createOrder(input)` que:
     - Construya el `OrderDTO` (sin `id`, `status`, `statusHistory`).
     - Llame a `firestoreCreateOrder`.
     - Convierta el `OrderDTO` resultante a `Order` con `toOrder`.
     - Retorne la orden persistida.
   - Mantener el error wrapping con `firebaseTryCatch`.

2. **Modificar `checkoutService.ts`**
   - Eliminar `SIMULATED_PAYMENT_DELAY_MS` y el `setTimeout`.
   - Eliminar la generación de `orderId` local.
   - Llamar a `ordersService.createOrder(...)` con los datos del carrito + checkout.
   - Retornar la orden guardada en Firestore.
   - Mantener validación de carrito vacío y cálculo de totales.

3. **Mantener userId en la orden**
   - El `userId` debe viajar en el DTO hacia Firestore.
   - `firestore.ts` ya valida `request.resource.data.userId == request.auth.uid` en las rules.

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/services/ordersService.ts` | Agregar método `createOrder` |
| `src/services/checkoutService.ts` | Eliminar simulación, usar `ordersService.createOrder` |

## Riesgos

- **Tests existentes**: `tests/unit/hooks/useCheckout.test.tsx` y `tests/unit/pages/CheckoutPage.test.tsx` pueden necesitar ajuste de mocks.
- **Firestore Rules**: La orden debe cumplir `orderAllowedFields()` y `pricesValid()`.

## Pasos de implementación

1. Leer `ordersService.ts` y agregar `createOrder`.
2. Leer `checkoutService.ts` y reemplazar simulación por llamada real.
3. Ejecutar `npm run build` y `npm run lint`.
4. Ejecutar tests de checkout y corregir mocks si es necesario.
5. Verificar que `userId` se guarde en Firestore.
