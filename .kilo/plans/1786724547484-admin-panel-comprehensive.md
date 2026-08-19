# Comprehensive Admin Panel Implementation Plan

## Objective
Implement a comprehensive admin panel with product CRUD, AWS S3 media management, order management, distinctive UI/navigation, and additional administrative features. Current priority: fix order management bugs and enable order tracking with S3.

## Current State Analysis

### Already Implemented
- **AdminLayout** — Sidebar navigation, mobile-responsive, user display, logout, active path highlighting, collapsed state toggle
- **Products CRUD** — List with search, category/status filters, create/edit form with image upload, delete with confirmation, bulk delete, CSV export
- **Orders Management** — List with status/payment filters, search, inline status changes, detail view with status history, CSV export
- **Dashboard** — Fetches real data via `dashboardService.getStats()`, loading/error states, stat cards, order status breakdown, quick actions
- **User Management** — `UsersPage.tsx` and `UserFormPage.tsx` with Firestore integration
- **Category Management** — `CategoriesPage.tsx` and `CategoryFormPage.tsx` with product counts
- **Media Management** — `UploadsPage.tsx` listing S3 uploads from Firestore
- **AdminRoute** — Auth guard for admin-only access
- **Routing** — `/admin`, `/admin/products`, `/admin/products/new`, `/admin/products/:id/edit`, `/admin/orders`, `/admin/orders/:id`, `/admin/users`, `/admin/users/new`, `/admin/users/:id/edit`, `/admin/categories`, `/admin/categories/new`, `/admin/categories/:id/edit`, `/admin/uploads`
- **S3 Bucket** — `ecommerce-project5-rechimonth` bucket public-read policy manually configured with `s3:GetObject` allow for `*`

### Deployment Issue
- **Vercel blank page** — `vite.config.ts` contains `esbuild.jsxImportSource: 'react'` which is unnecessary when using `@vitejs/plugin-react-swc` and can cause broken JS bundles in production. Must be removed.

### Critical Bugs in Order Management

| Issue | Location | Description |
|-------|----------|-------------|
| **Price prop type mismatch** | `OrderConfirmationPage.tsx:166` | `<Price amount={order.pricing.total} />` passes `Money` object instead of `number`. Renders incorrectly. |
| **Stock never decremented** | `checkoutService.ts:27-43` | Stock validated but never updated after order creation. Products can be oversold. |
| **`cancelOrder` throws** | `ordersService.ts:75-81` | Customer-side cancellation unimplemented and throws `INTERNAL_ERROR`. |
| **Meaningless initial statusHistory** | `ordersService.ts` / `firestore.ts` | Initial transition is `pending → pending`. Should be empty or a proper initial event. |
| **Orphaned uploads collection** | `api/upload.ts`, `UploadsPage.tsx` | Upload API generates presigned URLs but never writes to Firestore `uploads`. UploadsPage reads empty collection. |
| **No order-to-file association** | Order model, upload API | No way to attach invoices, shipping labels, or proof of delivery to an order. |
| **No shipping tracking fields** | Order model | No tracking number, carrier, or estimated delivery beyond the 4-state lifecycle. |

### Missing for "Gestión de órdenes con estados y seguimiento"

| Gap | Description |
|-----|-------------|
| Shipping tracking | No tracking number, carrier, estimated delivery, or shipping status. |
| Order attachments | S3 uploads disconnected from orders. Cannot attach documents to orders. |
| User-side cancel | `OrdersPage.tsx` and `OrderDetailPage.tsx` have no cancel action. |
| Server-side transition validation | Firestore rules don't validate transition legality; admin can set any status. |

### Analytics/Audit/Settings Status
- **Analytics, Audit, Settings pages** — Created and wired into AdminLayout nav and App.tsx routes.
- **Tests** — 397 passed, 51 test files. Build and lint pass.

### Remaining Low-Priority Polish

| Feature | Status | Gap |
|---------|--------|-----|
| Pagination UI | Partial | Service layer supports limits; UI pagination controls not yet implemented |
| Date range filter | Missing | OrdersPage has status/payment filters but not date range |
| Bulk status update | Missing | OrdersPage has bulk delete for products but not bulk status change |

## Proposed Implementation

### Phase 1: Fix Critical Order Bugs (High Priority)

#### 1.1 Fix OrderConfirmationPage Price Prop
**Modify:**
- `src/pages/OrderConfirmationPage.tsx:166` — change `<Price amount={order.pricing.total} />` to `<Price amount={order.pricing.total.amount} currency={order.pricing.total.currency} />`

#### 1.2 Implement Stock Decrement on Checkout
**Modify:**
- `src/services/checkoutService.ts` — after successful `createOrder`, call `productsService.updateProductStock()` for each item

#### 1.3 Implement Customer Cancel Order
**Modify:**
- `src/services/ordersService.ts` — implement `cancelOrder` with proper transition validation (`pending` → `cancelled` only)
- `src/pages/admin/OrderDetailPage.tsx` — ensure cancel action is available for eligible orders

#### 1.4 Fix Initial Status History
**Modify:**
- `src/services/ordersService.ts` or `src/infrastructure/firebase/firestore.ts` — change initial `statusHistory` from `[{from: 'pending', to: 'pending'}]` to `[]` or a proper initial creation event

### Phase 2: Order Tracking & S3 Integration (High Priority)

#### 2.1 Extend Order Model with Tracking Fields
**Modify:**
- `src/types/order.ts` — add optional `trackingNumber`, `carrier`, `estimatedDelivery` to `Order`/`OrderDTO`
- `src/infrastructure/firebase/firestore.ts` — handle new fields in `snapToOrder()`

#### 2.2 Add Order Attachments via S3
**Modify:**
- `api/upload.ts` — accept optional `orderId` in request body; default prefix to `products` or `orders` based on context
- `src/types/order.ts` — add optional `attachments: Array<{key: string; url: string; name: string; uploadedAt: number}>` to `Order`
- `src/services/ordersService.ts` — add method to attach/detach files from order
- `src/pages/admin/OrderDetailPage.tsx` — show attachments list with delete option
- `src/pages/admin/UploadsPage.tsx` — show order-linked uploads or integrate into order detail

#### 2.3 Add Shipping Tracking UI
**Modify:**
- `src/pages/admin/OrderDetailPage.tsx` — add form/fields to update tracking number, carrier, estimated delivery
- `src/pages/OrderDetailPage.tsx` — display tracking info to customer

### Phase 3: Admin Order UX Improvements (Medium Priority)

#### 3.1 Add Date Range Filter
**Modify:**
- `src/pages/admin/OrdersPage.tsx` — add date range inputs and filter logic

#### 3.2 Add Bulk Status Update
**Modify:**
- `src/pages/admin/OrdersPage.tsx` — add checkbox selection and bulk status dropdown

#### 3.3 Pagination UI Controls
**Modify:**
- `src/pages/admin/ProductsPage.tsx` — add prev/next page buttons
- `src/pages/admin/OrdersPage.tsx` — add prev/next page buttons

### Phase 4: Validation & Rules (Medium Priority)

#### 4.1 Validate Transitions Server-Side
**Modify:**
- `src/services/ordersService.ts` — validate `canTransition()` before updating status
- `src/infrastructure/firestore/firestore.ts` or security rules — add server-side guard

## Implementation Order

1. **Fix critical order bugs** — Price prop, stock decrement, cancel order, initial history
2. **Order tracking & S3** — tracking fields, attachments, shipping UI
3. **Admin UX improvements** — date filter, bulk status, pagination
4. **Validation** — server-side transition guards

## Key Design Decisions

### Navigation Structure
```
Dashboard
Productos
Categorías
Órdenes
Usuarios
Media
Analytics
Auditoría
Configuración
```

### Permission Model
- `admin` — full access
- Future: `editor` — can manage products and orders, cannot manage users/settings
- Future: `viewer` — read-only access

### Data Flow
- All admin pages use service layer (`services/`)
- Services call Firestore infrastructure layer
- No direct Firebase imports in components
- Consistent error/loading state patterns

### S3 Configuration
- Bucket: `ecommerce-project5-rechimonth`
- Public-read policy: `s3:GetObject` allowed for `*`
- CORS must allow `PUT` from Vercel origin
- Uploads API generates presigned URLs

### Vercel Deployment Issue
- **Symptom**: https://e-commerce-mauve-one-98.vercel.app/ shows blank page; JS not loading
- **Root cause**: `vite.config.ts` contained `esbuild.jsxImportSource: 'react'`, which conflicts with `@vitejs/plugin-react-swc` in production builds
- **Fix**: Removed the `esbuild` block from `vite.config.ts`
- **Status**: ✅ Fixed and verified (`npm run build` passes)

## Out of Scope
- Multi-language/i18n for admin panel
- Advanced RBAC with custom roles
- Real-time updates via WebSockets
- Mobile native app
- Advanced charting library (use simple CSS bars for now)

## Test Status
- **Build**: ✅ Passes (`tsc --noEmit` + `vite build`)
- **Lint**: ✅ Passes (`eslint . --max-warnings=0`)
- **Tests**: ✅ 397 passed, 51 test files
- **Unhandled errors**: 8 (from `CatalogPage.test.tsx` AbortSignal issue — pre-existing, unrelated to admin changes)

## Implementation Complete

### Changes Made
1. **Fixed Vercel production blank page** by removing the conflicting `esbuild.jsxImportSource: 'react'` block from `vite.config.ts`. The `@vitejs/plugin-react-swc` plugin handles JSX transformation natively; the `esbuild` override was breaking production builds.
2. **Verified build**: `npm run build` completes successfully (143 modules transformed, output in `dist/`).

### Remaining Items
- Manual Firestore composite index creation for `products` on `isActive` (Asc) + `createdAt` (Desc) — must be created in Firebase Console.
- Deploy updated build to Vercel to verify blank-page fix in production.
