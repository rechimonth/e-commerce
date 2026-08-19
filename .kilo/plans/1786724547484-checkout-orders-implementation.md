# Checkout & Order Management Implementation Plan

## Objective
Complete the checkout and order management flow, fix data consistency issues preventing existing orders from appearing, and integrate all requirements into the existing architecture.

## Current State Analysis

### What Already Exists
- `CheckoutPage` — Full checkout form (shipping, billing, payment method, notes)
- `checkoutService` — Simulates payment (400ms delay) and creates orders via `ordersService.createOrder`
- `OrdersPage` — Lists user orders with status badges, thumbnails, totals
- `OrderDetailPage` — Displays full order details (items, pricing, addresses, payment)
- Admin order pages (`AdminOrdersPage`, `AdminOrderDetailPage`) — Admin order management
- Cart provider with localStorage persistence
- Firestore security rules for orders (create/read/update)
- Order statuses: `pending`, `processing`, `completed`, `cancelled`

### Critical Issues Blocking Order Visibility

| # | Issue | Root Cause |
|---|-------|-----------|
| 1 | Seed orders not visible in app | `snapToOrder` in `firestore.ts` does **not** map `createdAt`/`updatedAt` from Firestore documents. DTO fields are `undefined`, causing `toOrder` to fall back to `statusHistory[0]?.timestamp`. If that timestamp is a `serverTimestamp()` or missing, dates are wrong or epoch. |
| 2 | No order confirmation after checkout | `CheckoutPage` navigates to `/orders` on success. No confirmation/summary page exists. |
| 3 | No stock validation at checkout | `checkoutService.processCheckout` does not verify product stock before creating order. |
| 4 | Orphaned transactional service | `src/services/orders.service.ts` has `createOrderFromCart` with `runTransaction` + stock validation, but is only used by `scripts/seedOrders.ts`. The app uses `ordersService.ts` which has no stock validation. |
| 5 | Admin `statusSelectValue` shared across rows | Single `useState` for all table rows causes all dropdowns to mirror each other. |
| 6 | `OrderDetailPage` retry broken | `onRetry` calls `ordersService.fetchOrder(id)` directly without triggering re-render. |

## Implementation Plan

### Task 1: Fix Core Data Consistency
**Files:** `src/infrastructure/firebase/firestore.ts`

Update `snapToOrder` to map `createdAt` and `updatedAt` from Firestore documents:
```typescript
createdAt: toMillis(data.createdAt),
updatedAt: toMillis(data.updatedAt),
```

This ensures all orders (app-created and seed) have proper timestamps. The existing `toMillis` helper already handles `Timestamp`, `Date`, and `number` fallbacks.

**Rationale:** This is the primary blocker for seed order visibility. Without these mappings, `toOrder` falls back to fragile `statusHistory` lookups.

### Task 2: Add Stock Validation to Checkout
**Files:** `src/services/checkoutService.ts`

Integrate stock validation into `processCheckout`:
1. Before payment simulation, fetch current product stock for each cart item via `productsService`
2. Compare requested quantity against available stock
3. Throw descriptive error if any item is out of stock
4. After payment succeeds, proceed with order creation

**Rationale:** Prevents overselling and provides clear user feedback before payment.

### Task 3: Create Order Confirmation Page
**New file:** `src/pages/OrderConfirmationPage.tsx`

Display after successful checkout:
- Success animation/icon
- Order ID
- Order date
- Item summary (thumbnails, names, quantities)
- Total amount
- "View Order Details" button → `/orders/:id`
- "Continue Shopping" button → `/catalog`

**Files to modify:**
- `src/constants/routes.ts` — Add `ORDER_CONFIRMATION: (id: string) => `/orders/${id}/confirmation``
- `src/app/App.tsx` — Add route for confirmation page
- `src/pages/CheckoutPage.tsx` — Navigate to confirmation page instead of `/orders`

### Task 4: Implement Customer Order Cancellation
**Files:** `src/services/ordersService.ts`

Replace the `cancelOrder` stub with real implementation:
1. Validate transition: only `pending` or `processing` → `cancelled`
2. Call `firestoreUpdateOrderStatus` (or add new infra function if needed)
3. Return updated `Order`

**Files to modify:**
- `src/pages/OrderDetailPage.tsx` — Add "Cancel Order" button for `pending`/`processing` orders

### Task 5: Fix Admin Page Bugs
**Files:** `src/pages/admin/OrdersPage.tsx`, `src/pages/admin/OrderDetailPage.tsx`

- Remove shared `statusSelectValue` state
- Initialize select with current order status per row
- Reset select to empty string after successful update

### Task 6: Fix OrderDetailPage Retry
**Files:** `src/pages/OrderDetailPage.tsx`

- Add `refreshKey` state
- Pass `refreshKey` as dependency to fetch effect
- `onRetry` increments `refreshKey` instead of calling service directly

### Task 7: Fix Typo in AdminOrderDetailPage
**Files:** `src/pages/admin/OrderDetailPage.tsx`

- Fix "Envíoío" → "Envío"
- Fix "Informaciónón" → "Información"
- Fix "Razónón" → "Razón"

### Task 8: Verify Seed Orders Visibility
**Action:** After Task 1, verify seed orders appear in the orders list.

If seed orders still don't appear:
- Check if they were written to the correct Firestore project/database
- Check security rules allow reads
- Verify `userId` matches authenticated user

### Task 9: Run Tests
**Commands:**
```bash
npm run build
npm run lint
npm run test -- --run
```

Fix any test failures introduced by changes.

## Validation Checklist
- [ ] `npm run build` passes with 0 TypeScript errors
- [ ] `npm run lint` passes with 0 warnings
- [ ] `npm run test -- --run` passes
- [ ] Checkout flow completes and shows confirmation page
- [ ] Orders appear in `/orders` list with correct dates
- [ ] Seed orders (if in correct Firestore) are visible
- [ ] Stock validation prevents checkout when items are out of stock
- [ ] Admin order status dropdowns work independently per row
- [ ] OrderDetailPage retry works correctly

## Out of Scope
- Real payment gateway integration
- Tax/shipping calculation logic (currently hardcoded to 0)
- Order search/filter/pagination enhancements
- Discount/coupon system
