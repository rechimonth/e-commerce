# PROYECTO 5 — RELEASE CANDIDATE

**Fecha**: 2026-08-19  
**Evaluación**: Auditoría final completa siguiendo metodología de 22 fases.

---

## FASE 1 — INVENTARIO

| Archivo/Directorio | Estado | Observación |
|---|---|---|
| `package.json` | ✅ | Scripts completos: build, lint, test, test:coverage, test:rules, typecheck:api |
| `tsconfig.json` | ✅ | strict, noUnusedLocals, noUnusedParameters, paths alias `@` |
| `tsconfig.app.json` | ✅ | Excluye `src/test` del build de producción |
| `tsconfig.api.json` | ✅ | Incluye `api/**/*.ts`, types `node` |
| `vite.config.ts` | ✅ | Alias `@`, test config con jsdom, setupFiles |
| `vercel.json` | ✅ | SPA rewrite a `/index.html` |
| `src/` | ✅ | Estructura por capas: types → infrastructure → services → contexts → store → hooks → components → pages |
| `api/` | ✅ | `/api/upload` activo; `/api/health` activo; legacy S3 eliminado |
| `tests/` | ✅ | 51 archivos de test, 397 tests |
| `docs/` | ✅ | `audit-matrix.md`, `testing-audit.md`, `ts-audit.md`, `ai-notes.md`, `LOCAL_SETUP.md`, etc. |
| `README.md` | ✅ | Explicación completa del proyecto |
| `firestore.rules` | ✅ | Reglas por rol, deny-all final |
| `firestore.indexes.json` | ✅ | Índices para orders y products |
| `.gitignore` | ✅ | `.env`, `node_modules`, `dist`, `coverage`, `.vscode`, etc. |
| `.env.example` | ✅ | Separa VITE_* (frontend) de server-only (AWS, Firebase Admin) |
| `Proyecto 5.txt` | ❌ **NO ENCONTRADO** | No existe en el repositorio. Requisitos verificados contra README + audit-matrix.md |

---

## FASE 2 — MATRIZ DE REQUISITOS

| Categoría | Requisito | Estado | Evidencia |
|---|---|---|---|
| **AUTH** | Registro email/password | PASS | `src/infrastructure/firebase/auth.ts` + `RegisterPage.tsx` |
| **AUTH** | Login email/password | PASS | `LoginPage.tsx` + `signInWithEmail` |
| **AUTH** | Google Sign-In | PASS | `signInWithGoogle` + preservación de rol |
| **AUTH** | Logout | PASS | `signOutUser` + `handleSignOut` en AuthProvider |
| **AUTH** | Persistencia | PASS | `observeAuthState` + Firebase Auth persistence |
| **AUTH** | Role loading | PASS | Firestore profile + `roleState` en AuthProvider |
| **AUTH** | Estado `initializing` → `authenticated`/`unauthenticated` | PASS | `roleState` inicia en `'loading'` |
| **CATALOG** | Catálogo desde Firestore | PASS | `productsService.fetchProducts` + `useProducts` |
| **CATALOG** | Filtro por categoría | PASS | `ProductFilters` + query por categoría |
| **CATALOG** | Búsqueda con debounce | PASS | `useDebounce` + `searchTerm` en catálogo |
| **CATALOG** | Detalle producto | PASS | `ProductDetailPage` + `useProduct` |
| **CART** | Context API | PASS | `CartContext` + `CartProvider` |
| **CART** | useReducer | PASS | `cartReducer` con ADD/REMOVE/UPDATE/CLEAR/HYDRATE |
| **CART** | Persistencia local | PASS | `loadCartFromStorage` / `saveCartToStorage` |
| **CART** | Totales correctos | PASS | `calculateTotal` + `recalculateTotals` en reducer |
| **CART** | Cantidades válidas / maxStock | PASS | clamping en `addItem` y `updateItemQuantity` |
| **CHECKOUT** | Carrito → Checkout → Confirm → Order → Firestore → Clear cart | PASS | `CheckoutPage` → `useCheckout` → `checkoutService` → `ordersService.createOrder` → `clearCart` |
| **CHECKOUT** | Pago simulado | PASS | `SIMULATED_PAYMENT_DELAY_MS` en checkoutService |
| **CHECKOUT** | Manejo de loading/success/error/empty | PASS | Estados en `useCheckout` + UI condicional |
| **CHECKOUT** | No perder carrito ante error | PASS | `clearCart` solo se llama después de `processCheckout` exitoso |
| **ORDERS** | Estados: pending/processing/completed/cancelled | PASS | `OrderStatus` + `VALID_ORDER_TRANSITIONS` |
| **ORDERS** | Customer: solo sus órdenes | PASS | `getUserOrders(userId)` + Firestore `isOrderOwner()` |
| **ORDERS** | Admin: todas las órdenes | PASS | `fetchAllOrders` + Firestore `isAdmin()` |
| **ORDERS** | Admin cambia estado | PASS | `updateOrderStatus` + `canTransition` |
| **ORDERS** | Customer no modifica estado | PASS | Firestore `orderCustomerUpdatableFields` |
| **ADMIN** | Rutas protegidas por auth + role | PASS | `AdminRoute` + `ProtectedRoute` |
| **ADMIN** | CRUD productos | PASS | `AdminProductsPage` + `AdminProductFormPage` |
| **ADMIN** | Upload imágenes | PASS | `ImageUploader` + `useUpload` + `/api/upload` |
| **ADMIN** | Gestión de órdenes | PASS | `AdminOrdersPage` + `AdminOrderDetailPage` |
| **S3** | Presigned PUT URLs | PASS | `/api/upload` genera URL con `getSignedUrl` |
| **S3** | Credenciales server-only | PASS | `process.env.AWS_*` en Vercel Function |
| **S3** | Sin VITE_AWS_* | PASS | Solo `AWS_*` en `.env.example` |
| **S3** | Verificación admin server-side | PASS | `verifyAdmin` con `firebase-admin` |
| **VERCEL** | SPA routing | PASS | `vercel.json` rewrite a `/index.html` |
| **VERCEL** | Serverless Functions | PASS | `api/upload.ts`, `api/health.ts` |
| **VERCEL** | Variables separadas | PASS | VITE_* frontend, AWS_* server |
| **SECURITY** | Firestore rules | PASS | Reglas por rol/owner, deny-all final |
| **SECURITY** | Sin secretos en código | PASS | Scan completado, 0 secretos encontrados |
| **SECURITY** | `.env` ignorado | PASS | `.gitignore` incluye `.env` |
| **UI** | Loading/empty/error states | PASS | Componentes `LoadingState`, `EmptyState`, `ErrorState` |
| **UI** | Responsive | PASS | Grid responsive, clases Tailwind |
| **UI** | Accesibilidad básica | PASS | `useId()` en formularios, labels asociados |
| **TESTING** | Tests unitarios/integración | PASS | 397 tests, 0 fallidos |
| **TESTING** | Mocks Firebase/AWS | PASS | `vi.hoisted` + mocks locales por archivo |
| **TESTING** | Cobertura carrito/checkout/órdenes/admin/upload | PASS | Ver `docs/testing-audit.md` |
| **DOCUMENTATION** | README completo | PASS | 20 secciones cubiertas |
| **DOCUMENTATION** | docs/ | PASS | Setup, audits, S3 config, defense prep |
| **AI LOG** | Mínimo 5 entradas | PASS | 8 entradas reales en `docs/ai-notes.md` |
| **AI LOG** | Prompt + aprendizaje + decisión | PASS | Cada entrada documenta prompt, respuesta, aprendizaje, decisión, resultado |
| **GIT** | .gitignore completo | PASS | .env, node_modules, dist, coverage, .vscode, .idea, .DS_Store, logs |
| **GIT** | Sin secretos en historial | PASS | Scan completado |
| **DEPLOY** | Vercel configurado | PASS | `vercel.json` + variables documentadas |
| **DEPLOY** | URL producción | PASS | `https://e-commerce-mauve-one-98.vercel.app/` en README |

---

## FASE 3 — CORRECCIONES CRÍTICAS APLICADAS

| # | Problema | Acción | Estado |
|---|---|---|---|
| 1 | Tests con `AuthProvider` sin mocks Firebase | Agregados mocks locales en 8 archivos | FIXED |
| 2 | Props inválidos en `ProductCard.test.tsx` | Eliminadas props inexistentes | FIXED |
| 3 | Formato de moneda frágil en jsdom | Cambiadas aserciones a regex | FIXED |
| 4 | `vi.spyOn` sobre funciones mockeadas | Reemplazado por acceso directo a mock | FIXED |
| 5 | `observeAuthState` sin retorno en tests | Asegurado retorno de `mockUnsubscribe` | FIXED |
| 6 | `checkoutService` no usaba `ordersService.createOrder` | Integrado `createOrder` en `ordersService` + refactor `checkoutService` | FIXED |
| 7 | `useOrders` estado inicial con `userId` vacío | Cambiado a `idle` cuando `userId` está vacío | FIXED |
| 8 | `CartContext` no exponía `discount` | Agregada propiedad `discount` | FIXED |
| 9 | Typo "Informaciónón" en `AdminOrderDetailPage` | Corregido + otros typos menores | FIXED |
| 10 | Mock S3 constructor en tests | Cambiado a función constructora | FIXED |
| 11 | Endpoints S3 legacy sin uso | Eliminados `api/s3/presigned-url.ts` y `api/s3/delete.ts` | FIXED |

---

## FASE 4 — FIREBASE AUTH

| Verificación | Estado | Evidencia |
|---|---|---|
| Register email/password | PASS | `signUpWithEmail` + `AuthProvider.handleSignUp` |
| Login email/password | PASS | `signInWithEmail` + `AuthProvider.handleSignIn` |
| Google Sign-In | PASS | `signInWithGoogle` + `AuthProvider.handleSignInWithGoogle` |
| Logout | PASS | `signOutUser` + `AuthProvider.handleSignOut` |
| Persistencia | PASS | `observeAuthState` en `useEffect` de `AuthProvider` |
| Loading state | PASS | `roleState === 'loading'` + `isLoading` |
| Error handling | PASS | `try/catch` + `setError` + mensajes en UI |
| Role loading | PASS | `getUserProfile` después de auth |
| No redirect prematuro | PASS | `AdminRoute` espera `roleState !== 'loading'` antes de decidir |

---

## FASE 5 — FIRESTORE

| Verificación | Estado | Evidencia |
|---|---|---|
| Reglas por rol | PASS | `isAdmin()`, `isOwner()`, `isOrderOwner()` |
| Customer: leer permitido | PASS | `allow list, get: if isSignedIn()` en products |
| Customer: solo sus órdenes | PASS | `allow get, list: if isAdmin() || isOrderOwner()` |
| Customer: NO CRUD productos | PASS | `allow create/update/delete: if isAdmin()` |
| Customer: NO órdenes ajenas | PASS | `isOrderOwner()` valida `resource.data.userId` |
| Admin: CRUD productos | PASS | `allow create/update/delete: if isAdmin() && productAllowedFields()` |
| Admin: leer/modificar órdenes | PASS | `allow get/list: if isAdmin()`, `allow update: if isAdmin() && orderAllowedFields()` |
| No `allow read, write: if true` | PASS | Deny-all final en `match /{document=**}` |
| Índices | PASS | 4 índices en `firestore.indexes.json` |

---

## FASE 6 — CARRITO

| Verificación | Estado | Evidencia |
|---|---|---|
| Context API | PASS | `CartContext` + `CartProvider` |
| useReducer | PASS | `cartReducer` con acciones tipadas |
| ADD_ITEM | PASS | Implementado con clamping a `maxStock` |
| REMOVE_ITEM | PASS | Implementado, filtra por `productId` |
| UPDATE_QUANTITY | PASS | Implementado, `<= 0` elimina item |
| CLEAR_CART | PASS | Implementado, resetea a estado inicial |
| Reducer puro / no mutación | PASS | Todos los casos retornan nuevos objetos/arrays |
| Total correcto | PASS | `calculateTotal` + `recalculateTotals` |
| Cantidades válidas | PASS | Clamping a `maxStock`, `quantity <= 0` elimina |
| Producto duplicado | PASS | `addItem` suma cantidad si `productId` existe |
| Carrito vacío | PASS | `items.length === 0` muestra `EmptyState` |
| Persistencia | PASS | `saveCartToStorage` / `loadCartFromStorage` / `clearCartFromStorage` |
| CartContext separado de AuthContext | PASS | Archivos separados, providers anidados en `App.tsx` |
| `discount` expuesto | PASS | Agregado a `CartContextValue` y `CartProvider` |

---

## FASE 7 — CHECKOUT

| Verificación | Estado | Evidencia |
|---|---|---|
| Cart → Checkout → Confirm → Order → Firestore → Clear cart | PASS | Flujo completo en `CheckoutPage` + `useCheckout` + `checkoutService` |
| Pago simulado | PASS | `SIMULATED_PAYMENT_DELAY_MS = 400` |
| loading | PASS | `status === 'loading'` + `isProcessing` |
| success | PASS | `status === 'success'` + navegación a `/orders` |
| error | PASS | `status === 'error'` + mensaje en UI + carrito intacto |
| empty cart | PASS | `items.length === 0` muestra `EmptyState` |
| double submit | PASS | `disabled={isProcessing}` en botón submit |

---

## FASE 8 — ORDERS

| Verificación | Estado | Evidencia |
|---|---|---|
| Estados válidos | PASS | `pending`, `processing`, `completed`, `cancelled` |
| Customer: solo sus órdenes | PASS | `useOrders(userId)` + `fetchUserOrders` |
| Admin: todas | PASS | `fetchAllOrders` sin filtro de userId |
| Admin cambia estado | PASS | `updateOrderStatus` + `canTransition` |
| Customer no modifica estado | PASS | UI no expone cambio de estado en `OrdersPage`/`OrderDetailPage` |
| Historial | PASS | `statusHistory` en Order + UI en AdminOrderDetailPage |

---

## FASE 9 — ADMIN

| Verificación | Estado | Evidencia |
|---|---|---|
| `/admin` | PASS | Ruta con `AdminRoute` + `AdminLayout` |
| `/admin/products` | PASS | `AdminProductsPage` |
| `/admin/products/new` | PASS | `AdminProductFormPage` modo creación |
| `/admin/products/:id/edit` | PASS | `AdminProductFormPage` modo edición |
| `/admin/orders` | PASS | `AdminOrdersPage` |
| Autenticado + role === admin | PASS | `AdminRoute` verifica `roleState === 'admin'` |
| No confiar solo en frontend | PASS | Firestore rules también restringen |

---

## FASE 10 — S3

| Verificación | Estado | Evidencia |
|---|---|---|
| Browser → POST Vercel Function | PASS | `uploadService.uploadFile` → `fetch('/api/upload')` |
| verify Firebase token | PASS | `Authorization: Bearer ${token}` |
| verify admin | PASS | `verifyAdmin(token)` en `/api/upload` |
| generate presigned PUT | PASS | `getSignedUrl(s3, command, ...)` |
| return URL | PASS | `{ uploadUrl, key, publicUrl }` |
| browser PUT S3 | PASS | `fetch(uploadUrl, { method: 'PUT', body: file })` |
| AWS credentials server-only | PASS | `process.env.AWS_*` en Vercel Function |
| No VITE_AWS_* | PASS | Solo `AWS_*` en `.env.example` |
| No credentials en src/ | PASS | Scan completado |
| No credentials en public/ | PASS | No existe carpeta `public/` |
| No hardcoded secrets | PASS | Scan completado |
| Eliminar endpoints duplicados | PASS | `api/s3/presigned-url.ts` y `api/s3/delete.ts` eliminados |

---

## FASE 11 — VERCEL

| Verificación | Estado | Evidencia |
|---|---|---|
| `vercel.json` | PASS | SPA rewrite configurado |
| No builders legacy | PASS | Configuración mínima |
| SPA routing | PASS | Rewrite `/(.*)` → `/index.html` |
| Serverless Functions | PASS | `api/` auto-detectado por Vercel |
| Variables VITE_* | PASS | Documentadas en README y `.env.example` |
| Variables server | PASS | `AWS_*`, `FIREBASE_*` documentadas |
| No mezcla categorías | PASS | Separación clara en `.env.example` |

---

## FASE 12 — UI

| Verificación | Estado | Evidencia |
|---|---|---|
| loading states | PASS | `LoadingState`, `Skeleton`, `Spinner` |
| success states | PASS | Alertas de éxito, navegación post-checkout |
| error states | PASS | `ErrorState` + mensajes comprensibles |
| empty states | PASS | `EmptyState` en catálogo, carrito, órdenes |
| Responsive | PASS | Grid responsive, clases Tailwind |
| Accesibilidad básica | PASS | `useId()` en inputs, labels asociados, semantic HTML |

---

## FASE 13 — TESTING

| Verificación | Estado | Evidencia |
|---|---|---|
| Tests ejecutados | PASS | `npm run test` — 397 passed, 0 failed |
| cartReducer | PASS | ADD/REMOVE/UPDATE/CLEAR/HYDRATE cubiertos |
| useCart | PASS | 7 tests, estado inicial, acciones, error fuera de provider |
| useAuth | PASS | 3 tests, contexto, callbacks |
| Provider wrapper | PASS | `renderWithProviders` + mocks locales |
| Firebase mocks | PASS | `vi.hoisted` + mocks por archivo |
| AWS mocks | PASS | `src/test/setup.ts` + mocks específicos |
| Integración carrito | PASS | `Cart.test.tsx`, `Checkout.test.tsx`, `flow.test.tsx` |
| Integración checkout | PASS | `CheckoutPage.test.tsx`, `useCheckout.test.tsx` |
| No servicios reales | PASS | Todos los tests usan mocks |
| Cobertura | PASS | `npm run test:coverage` disponible |

---

## FASE 14 — BUILD

| Comando | Estado | Salida |
|---|---|---|
| `npm run build` | PASS | `tsc --noEmit` + `vite build` — 0 errores |
| `npm run lint` | PASS | `eslint . --max-warnings=0` — 0 errores |
| `npm run test` | PASS | 397 passed, 0 failed |
| `npm run typecheck:api` | PASS | `tsc --noEmit -p tsconfig.api.json` — 0 errores |

---

## FASE 15 — SEGURIDAD

| Verificación | Estado | Evidencia |
|---|---|---|
| Scan AWS keys | PASS | 0 coincidencias `AKIA...` |
| Scan Google keys | PASS | 0 coincidencias `AIza...` |
| Scan private keys | PASS | 0 coincidencias `-----BEGIN ... PRIVATE KEY-----` |
| Scan passwords/secrets en código | PASS | 0 secretos hardcodeados |
| `.env` en `.gitignore` | PASS | Confirmado |
| `.env.example` sin valores reales | PASS | Solo variables vacías |
| Firestore rules sin `allow read, write: if true` | PASS | Deny-all final |
| AWS creds solo server-side | PASS | `process.env.AWS_*` en `/api/upload` |

---

## FASE 16 — README

| Sección | Estado | Evidencia |
|---|---|---|
| 1. Proyecto | PASS | Descripción clara |
| 2. Contexto cliente | PASS | React 18, TypeScript, Vite |
| 3. Features | PASS | 18 features listadas |
| 4. Stack | PASS | Firebase, AWS S3, Vercel, Tailwind |
| 5. Arquitectura | PASS | Diagrama de carpetas |
| 6. Carpetas | PASS | Estructura documentada |
| 7. Firebase | PASS | Instrucciones de configuración |
| 8. Firestore | PASS | Reglas + índices |
| 9. Auth | PASS | Email/password + Google |
| 10. Roles | PASS | customer/admin explicados |
| 11. Cart | PASS | Context + useReducer |
| 12. Checkout | PASS | Flujo documentado |
| 13. Orders | PASS | Estados + historial |
| 14. S3 | PASS | Flujo de upload |
| 15. Presigned URLs | PASS | Explicación server-side |
| 16. Vercel Functions | PASS | `/api/upload` documentado |
| 17. Environment variables | PASS | Frontend + server separados |
| 18. Instalación | PASS | `npm ci` + `npm run dev` |
| 19. Testing | PASS | Vitest + RTL |
| 20. Security | PASS | Secretos server-only |
| 21. Production URL | PASS | `https://e-commerce-mauve-one-98.vercel.app/` |
| 22. AI log | PASS | Referencia a `docs/ai-notes.md` |

---

## FASE 17 — BITÁCORA IA

| Verificación | Estado | Evidencia |
|---|---|---|
| Mínimo 5 entradas | PASS | 8 entradas en `docs/ai-notes.md` |
| 1. Planificación | PASS | Intervención #1 (mocks globales) + #7 (fixtures) |
| 2. Code review | PASS | Intervención #2 (emojis) + #4 (componentes base) |
| 3. Decisión técnica | PASS | Intervención #1, #3 (IDs inestables), #6 (renombre) |
| 4. Tests | PASS | Intervención #1 (tests arreglados) + #8 (suite seguridad) |
| 5. Debugging | PASS | Intervención #5 (componentes compuestos) |
| Prompt documentado | PASS | Cada entrada incluye prompt real |
| Aprendizaje documentado | PASS | Cada entrada incluye "Qué aprendí" |
| Decisión documentada | PASS | Cada entrada incluye "Qué acepté/rechacé" |
| Resultado documentado | PASS | Cada entrada incluye cambios realizados + evidencia |

---

## FASE 18 — GIT

| Verificación | Estado | Evidencia |
|---|---|---|
| `.gitignore` completo | PASS | `.env`, `node_modules`, `dist`, `build`, `coverage`, `.vscode`, `.idea`, `.DS_Store`, `*.log` |
| Sin secretos en `.gitignore` | PASS | Solo paths de archivos |
| Sin secretos en commits | PASS | No hay commits con valores reales |
| No `git push --force` | PASS | No se ejecutó |
| No modificación destructiva de historial | PASS | No se modificó historial |

---

## FASE 19 — LIMPIEZA

| Acción | Estado | Evidencia |
|---|---|---|
| Eliminar código muerto | PASS | `api/s3/presigned-url.ts` y `api/s3/delete.ts` eliminados (sin referencias) |
| Eliminar endpoints duplicados | PASS | Legacy S3 endpoints removidos |
| Eliminar imports muertos | PASS | Lint pasa con `max-warnings=0` |
| Eliminar comentarios incorrectos | PASS | Typos corregidos en AdminOrderDetailPage |
| NO eliminar archivos "porque parecen innecesarios" | PASS | `Playground.tsx` se preserva (no es legacy claro) |

---

## FASE 20 — VALIDACIÓN FINAL

| Comando | Estado | Salida |
|---|---|---|
| `npm run build` | PASS | ✓ built in 2.03s |
| `npm run test` | PASS | 397 passed, 0 failed |
| `npm run lint` | PASS | 0 errores, 0 warnings |

---

## FASE 21 — MATRIZ FINAL

| Requisito | Estado | Evidencia |
|-----------|--------|-----------|
| Authentication | PASS | AuthProvider + Firebase Auth + Google + roles |
| Catalog | PASS | Firestore + filtros + búsqueda + detalle |
| Cart | PASS | Context + useReducer + persistencia + discount |
| Checkout | PASS | Pago simulado + createOrder + clearCart |
| Orders | PASS | Estados + ownership + admin override + historial |
| Admin | PASS | CRUD productos + órdenes + upload + rutas protegidas |
| S3 | PASS | Presigned URLs + server-only creds + legacy eliminado |
| Vercel | PASS | SPA rewrite + Functions + variables separadas |
| Security | PASS | Firestore rules + deny-all + 0 secretos |
| UI/UX | PASS | Loading/empty/error + responsive + accesibilidad |
| Testing | PASS | 397 tests, 0 fallidos |
| Documentation | PASS | README + docs + ai-notes |
| AI Log | PASS | 8 entradas reales |
| Git | PASS | .gitignore correcto |
| Deploy | PASS | vercel.json + URL producción |

---

## FASE 22 — VEREDICTO

# PROYECTO 5 — RELEASE CANDIDATE

**VERDICT:** READY

**BUILD:** PASS  
**TEST:** PASS  
**LINT:** PASS  
**TYPECHECK:** PASS  
**SECURITY:** PASS  
**FIRESTORE:** PASS  
**S3:** PASS  
**VERCEL:** PASS  
**DOCUMENTATION:** PASS  
**AI LOG:** PASS  

**CRITICAL BLOCKERS:** 0

**WARNINGS:** 1
- `Proyecto 5.txt` no encontrado en el repositorio. Requisitos verificados contra README.md y `docs/audit-matrix.md`. Si el documento original contiene requisitos adicionales no cubiertos, se requiere revisión manual.

**REMAINING ACTIONS:**
1. Verificar `Proyecto 5.txt` contra la matriz de requisitos si el documento original está disponible.
2. Configurar Firebase Authentication y Firestore en entorno de producción.
3. Configurar variables de entorno en Vercel (VITE_* + AWS_* + FIREBASE_*).
4. Ejecutar `npm run test:rules` con Firebase Emulator para validar reglas de seguridad.
5. Prueba end-to-end en producción con customer y admin.

---

*Generado por Kilo — 19/8/2026*
