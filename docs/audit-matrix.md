# Auditoría final — Proyecto Integrador 5

Esta matriz describe lo que el código implementa. Los flujos que dependen de servicios externos deben verificarse también en un entorno real antes de afirmar que producción está certificada.

| Requisito | Estado | Evidencia |
|---|---|---|
| React 18 + TypeScript + Vite | PASS | package.json, src/ |
| Arquitectura por capas | PASS | types, infrastructure, services, contexts, hooks, components, pages |
| Auth email/password | PASS | Firebase Auth + LoginPage/RegisterPage |
| Auth Google | PASS | signInWithGoogle + preservación de rol existente |
| Logout/persistencia | PASS | Firebase Auth observer/persistence |
| Roles customer/admin | PASS | perfil Firestore + AdminRoute + Firestore Rules |
| Catálogo Firestore | PASS | productsService/firestore |
| Filtro categoría | PASS | ProductFilters + Firestore query |
| Búsqueda con debounce | PASS | useDebounce + catálogo |
| Detalle producto | PASS | ProductDetailPage |
| Carrito Context API | PASS | CartContext/CartProvider |
| Carrito useReducer | PASS | cart utilities/reducer |
| Persistencia carrito | PASS | store/cart/persistence |
| Checkout simulado | PASS | checkoutService → /api/checkout |
| Precio autoritativo | PASS | /api/checkout lee priceCents desde products en servidor |
| Stock autoritativo | PASS | /api/checkout valida y descuenta stock en transacción |
| Orden + stock atómicos | PASS | Firestore Admin transaction |
| Creación directa de orden desde cliente | DENY | firestore.rules: allow create: if false |
| No perder carrito ante error | PASS | CheckoutPage + useCheckout |
| Estados de orden | PASS | OrderStatus + transitions |
| Historial propio | PASS | getUserOrders + ordersService |
| Detalle de orden | PASS | OrderDetailPage + ownership rules |
| Admin CRUD productos | PASS | AdminProductFormPage/ProductsPage |
| Upload S3 presigned | PASS | /api/upload + AWS SDK |
| Auth server-side upload | PASS | firebase-admin verifyIdToken + role Firestore |
| AWS secrets frontend | PASS | no VITE_AWS_*; server-only env |
| Admin ve todas las órdenes | PASS | getAllOrders + rules |
| Filtrar órdenes | PASS | AdminOrdersPage |
| Cambiar estado | PASS | updateOrderStatus + admin UID |
| UI loading/empty/error | PASS | componentes reutilizables |
| Testing unit/integration | PASS esperado | debe confirmarse ejecutando `npm test` en el checkout actualizado |
| Firestore rules | PASS esperado | ejecutar `npm run test:rules` con Emulator |
| Firestore indexes | PASS | firestore.indexes.json |
| Vercel deploy | NOT VERIFIED | depende de configuración real de Vercel |
| URL pública | NOT VERIFIED | debe verificarse después del deploy |
| README | PASS | README.md |
| Bitácora AI | PASS | docs/ai-notes.md |
| Extras | OMITIDOS | son opcionales según Proyecto 5 |

## Seguridad de checkout

El navegador solo envía `productId` y `quantity`. No envía precios confiables ni stock. `/api/checkout` autentica el Firebase ID token, lee los productos con Firebase Admin SDK, calcula el subtotal con los precios actuales, valida stock y crea la orden y el descuento de stock dentro de una sola transacción.

Las reglas de Firestore bloquean la creación directa de órdenes desde el SDK cliente. Esto es intencional: evita que una futura modificación del frontend vuelva a permitir que el cliente controle el precio o el stock.

## Verificación pendiente fuera del código

1. `npm ci`
2. `npm run lint`
3. `npm run build`
4. `npm run typecheck:api`
5. `npm test`
6. `npm run test:rules` con Firebase Emulator
7. configuración real de Firebase Authentication
8. configuración real de Firestore
9. configuración real de S3/CORS
10. variables server-only de Vercel
11. deploy de Vercel
12. prueba end-to-end con customer y admin

No inventar resultados de estas verificaciones.
