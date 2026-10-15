# Matriz de cumplimiento — E-Commerce

**Actualizado:** 15/10/2026. La búsqueda global, la transición masiva de estados, la paginación admin y la coherencia de categorías se están cerrando en código. No marcar producción como verificada hasta completar CI y smoke test autenticado.

| Requisito | Estado | Evidencia / límite |
|---|---|---|
| React 18 + TypeScript + Vite | PASS | `package.json`, `src/` |
| Arquitectura por capas | PASS | `types`, `infrastructure`, `services`, `contexts`, `hooks`, `components`, `pages` |
| Auth email/password y Google | IMPLEMENTADO | Firebase Auth; la configuración de proveedores debe verificarse en Firebase real |
| Logout y persistencia de sesión | IMPLEMENTADO | Firebase Auth observer/persistence |
| Roles customer/admin | IMPLEMENTADO | Perfil Firestore, rutas protegidas, validación server-side y reglas |
| Catálogo, categorías, búsqueda debounce y detalle | CORREGIDO EN CÓDIGO; VALIDACIÓN PENDIENTE | Búsqueda sobre el conjunto activo antes de paginar; categorías deben mantenerse alineadas con Firestore Rules |
| Carrito Context API + useReducer | IMPLEMENTADO | `src/store/cart/CartProvider.tsx`, `src/utils/cart/cartUtils.ts` |
| Persistencia de carrito por usuario | IMPLEMENTADO | Firestore `carts/{uid}` con reglas por propietario; localStorage es caché/offline |
| Checkout simulado | IMPLEMENTADO | `src/services/checkoutService.ts`, `api/checkout.ts`; no cobra dinero real |
| Revalidación de precio y stock | IMPLEMENTADO | Backend lee productos y crea orden/transacción |
| Historial, detalle y cancelación de órdenes | CORREGIDO EN CÓDIGO; VALIDACIÓN PENDIENTE | Cancelación admin debe reponer stock en la misma transacción |
| CRUD de productos admin | IMPLEMENTADO | Páginas y servicios administrativos |
| Upload S3 presigned POST | IMPLEMENTADO EN CÓDIGO | `api/upload.ts` + `src/services/uploadService.ts`; requiere prueba con bucket real |
| Reglas Firestore de carrito y roles | CI PASS PREVIO | Volver a ejecutar con el commit de cierre |
| Flujos UI carrito → checkout | CI PASS PREVIO | El servicio remoto de checkout está mockeado |
| Lint, pruebas, build y typecheck API | PENDIENTE PARA EL COMMIT DE CIERRE | No reutilizar el estado de un commit anterior |
| Vercel | PARCIAL | Deployment READY y `/api/health` 200 previamente; falta E2E autenticada con el commit final |
| Variables Vercel/Firebase/AWS | PENDIENTE DE VERIFICACIÓN EXTERNA | Verificar scopes/valores en los proveedores; no inferirlos del repo |
| S3 real: CORS, carga y lectura | PENDIENTE E2E | Requiere bucket y credenciales reales |
| Presentación/defensa | PENDIENTE DEL EQUIPO | Ejecutar checklist con cuentas de prueba |

## Pruebas automáticas de CI

El workflow ejecuta `npm ci`, `npm run lint`, `npm test`, Firebase Emulator + `npm run test:rules`, `npm run build` y `npm run typecheck:api`. Cada cambio debe validarse en su propia ejecución de CI.

## Checklist de smoke test real

- [ ] Customer: iniciar sesión, añadir productos, cambiar cantidades, recargar y comprobar persistencia del carrito.
- [ ] Customer: checkout simulado, comprobar orden e inventario; provocar un error y confirmar que el carrito se conserva.
- [ ] Admin: crear/editar producto, subir imagen y verificar URL de S3.
- [ ] Admin: completar órdenes siguiendo las transiciones permitidas y cancelar una orden; verificar reposición de stock.
- [ ] Admin: eliminar orden y confirmar que no reaparece tras recargar.
- [ ] Comprobar que customer no accede a rutas ni APIs admin.
- [ ] Verificar `/api/health` y logs de Functions sin exponer secretos.

## Configuración externa

Verificar en Vercel/Firebase/AWS las variables `VITE_FIREBASE_*`, `FIREBASE_WEB_API_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON` (o variables divididas), `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_REGION` y `ALLOWED_ORIGINS`. AWS y Firebase Admin deben ser server-only.