# Production readiness — estado verificado

**Última revisión:** 14/10/2026  
**Repositorio:** `rechimonth/e-commerce`  
**Rama de trabajo:** `main`

> Este documento reemplaza el informe histórico del 15/08/2026. Los recuentos antiguos de fallos y los diagnósticos de configuración de aquella sesión no deben tratarse como estado actual.

## Evidencia actual

La ejecución de CI para el commit `4d5333f9194b4485f3158753c858b45c4fd98410` terminó correctamente:

- `npm ci`
- `npm run lint`
- `npm test`
- Firebase Emulator + `npm run test:rules`
- `npm run build`
- `npm run typecheck:api`

[Ver ejecución completa en GitHub Actions](https://github.com/rechimonth/e-commerce/actions/runs/38656741694).

La suite incluye un flujo de integración de carrito → checkout → confirmación y una prueba de fallo que comprueba que el carrito se conserva. El servicio remoto de checkout está mockeado en esas pruebas; no son un checkout E2E contra Firebase de producción.

## Estado por área

| Área | Estado | Nota |
|---|---|---|
| Build / TypeScript frontend | PASS CI | Build de producción completado |
| TypeScript API | PASS CI | `npm run typecheck:api` completado |
| Lint | PASS CI | `npm run lint` completado |
| Pruebas unitarias/integración | PASS CI | Incluye flujo de carrito/checkout con límite remoto mockeado |
| Reglas Firestore | PASS CI | Suite ejecutada con Emulator, incluidas reglas de carrito por UID |
| Carrito cloud | IMPLEMENTADO | Firestore por UID + localStorage como caché/fallback |
| Checkout/órdenes | IMPLEMENTADO EN CÓDIGO | Servidor revalida precios/stock; falta una compra autenticada real en producción |
| S3 presigned POST | IMPLEMENTADO EN CÓDIGO | El acceso real al bucket, CORS y lectura pública/firmada requieren smoke test externo |
| Vercel | PARCIAL | El check de integración está disponible; no se afirma que se haya completado un flujo real autenticado |
| Variables de entorno | NO VERIFICABLES DESDE EL REPO | Comprobar valores y scopes en el proyecto Vercel/Firebase/AWS correcto |
| Defensa/presentación | PENDIENTE | Ejecutar el checklist al final de `docs/audit-matrix.md` |

## Variables que hay que verificar en el proveedor

Frontend Firebase:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Server-only:
- `FIREBASE_WEB_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_JSON` o las variables divididas equivalentes
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `AWS_REGION`
- `ALLOWED_ORIGINS`

No registrar valores secretos en logs, README, issues o commits. `.env.example` debe conservar únicamente nombres y valores de ejemplo vacíos/no sensibles.

## Pasos restantes fuera del código

1. En el proyecto Firebase correcto, confirmar email/password y Google Auth, dominios autorizados, reglas e índices desplegados.
2. En Vercel, verificar las variables de Production y que el proyecto conectado sea `rechimonths-projects/e-commerce`.
3. Ejecutar `curl -I https://e-commerce-mauve-one-98.vercel.app/` y `curl -fsS https://e-commerce-mauve-one-98.vercel.app/api/health`.
4. Completar smoke test autenticado como customer y admin siguiendo `docs/audit-matrix.md`.
5. Probar una carga S3 real, comprobar CORS y confirmar que la imagen resultante se ve en el catálogo.
6. Registrar únicamente resultados observados, incluyendo fecha, URL y errores relevantes sin tokens/secretos.

**Criterio de cierre:** no marcar producción como totalmente verificada hasta terminar esos pasos con credenciales reales.