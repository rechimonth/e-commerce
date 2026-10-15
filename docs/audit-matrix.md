# Matriz de cumplimiento — E-Commerce

**Actualizado:** 14/10/2026. Esta matriz separa funcionalidad implementada, validación automática y comprobaciones que requieren acceso a servicios reales.

| Requisito | Estado | Evidencia / límite |
|---|---|---|
| React 18 + TypeScript + Vite | PASS | `package.json`, `src/` |
| Arquitectura por capas | PASS | `types`, `infrastructure`, `services`, `contexts`, `hooks`, `components`, `pages` |
| Auth email/password y Google | IMPLEMENTADO | Firebase Auth; la configuración de proveedores debe verificarse en el proyecto Firebase real |
| Logout y persistencia de sesión | IMPLEMENTADO | Firebase Auth observer/persistence |
| Roles customer/admin | IMPLEMENTADO | Perfil Firestore, rutas protegidas, validación server-side y reglas |
| Catálogo, categorías, búsqueda debounce y detalle | IMPLEMENTADO | Servicio de productos, filtros y páginas de catálogo |
| Carrito Context API + useReducer | IMPLEMENTADO | `src/store/cart/CartProvider.tsx`, `src/utils/cart/cartUtils.ts` |
| Persistencia de carrito por usuario | IMPLEMENTADO | Firestore `carts/{uid}` con reglas por propietario; localStorage es caché/offline |
| Checkout simulado | IMPLEMENTADO | `src/services/checkoutService.ts`, `api/checkout.ts`; no cobra dinero real |
| Revalidación de precio y stock | IMPLEMENTADO | Backend lee productos y crea orden/transacción |
| Historial, detalle y cancelación de órdenes | IMPLEMENTADO | Servicios de órdenes y endpoints protegidos |
| CRUD de productos admin | IMPLEMENTADO | Páginas y servicios administrativos |
| Upload S3 presigned POST | IMPLEMENTADO EN CÓDIGO | `api/upload.ts` + `src/services/uploadService.ts`; no prueba por sí solo bucket/CORS reales |
| Reglas Firestore de carrito y roles | CI PASS | `firestore.rules` + suite Firebase Emulator |
| Flujos UI carrito → checkout | CI PASS | `tests/integration/cart-checkout-flow.test.tsx`; el límite remoto de checkout está mockeado |
| Lint, pruebas, build y typecheck API | CI PASS | Run de GitHub Actions: [38657289399](https://github.com/rechimonth/e-commerce/actions/runs/38656741694) |
| Vercel | PARCIAL | El check de integración despliega; falta una prueba autenticada completa contra el alias de producción |
| Variables Vercel/Firebase/AWS | PENDIENTE DE VERIFICACIÓN EXTERNA | No se pueden inferir sus valores desde el repositorio |
| S3 real: CORS, carga y lectura | PENDIENTE E2E | Requiere bucket y credenciales reales |
| Presentación/defensa | PENDIENTE DEL EQUIPO | Preparar demostración de customer/admin, seguridad, carrito cloud y upload firmado |

## Pruebas automáticas de CI

El workflow ejecuta, en orden:

1. `npm ci`
2. `npm run lint`
3. `npm test`
4. Firebase Emulator y `npm run test:rules`
5. `npm run build`
6. `npm run typecheck:api`

No declarar una prueba real de producción o una subida a S3 como exitosa basándose solo en mocks o en un check verde de Vercel.

## Checklist de smoke test real antes de presentar

- [ ] Iniciar sesión como customer y comprobar que no puede acceder a rutas/API admin.
- [ ] Añadir dos productos, cambiar cantidades y verificar total.
- [ ] Recargar y abrir la sesión en otro navegador/dispositivo: comprobar sincronización del carrito por UID.
- [ ] Completar checkout simulado y confirmar que la orden aparece en historial; verificar que el carrito se limpia solo tras éxito.
- [ ] Provocar un error de checkout y confirmar que el carrito se conserva.
- [ ] Iniciar sesión como admin, crear/editar un producto y subir una imagen.
- [ ] Verificar que el objeto S3 se puede leer desde la URL prevista y que un usuario no admin no puede pedir una firma.
- [ ] Cambiar estado de una orden como admin y confirmar que el cliente ve el estado actualizado.
- [ ] Verificar `/api/health` en el dominio real y revisar logs de Functions sin exponer secretos.

## Configuración externa que no debe inventarse

Verificar en Vercel/Firebase/AWS: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `FIREBASE_WEB_API_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON` (o formato dividido), `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_REGION` y `ALLOWED_ORIGINS`.

Las variables AWS y Firebase Admin deben ser server-only. No copiar credenciales al frontend ni a GitHub. Desplegar `firestore.rules` y los índices en el proyecto Firebase correcto antes de probar los flujos reales.
