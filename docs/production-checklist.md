# Production readiness — estado verificado

**Última revisión:** 15/10/2026  
**Repositorio:** `rechimonth/e-commerce`  
**Rama:** `main`

## Correcciones de cierre incluidas o en curso

- Búsqueda por nombre sobre el conjunto completo de productos activos antes de paginar.
- Panel de órdenes sin límite fijo de 50 registros, con páginas de 20.
- Acción masiva respeta `pending → processing → completed` y comunica fallos por orden.
- Cancelación admin repone stock en la misma transacción que cambia el estado.
- La taxonomía de categorías debe ser fija y coherente con las reglas Firestore.
- La guía local indica usar `npx vercel dev` para probar funciones `/api/*`.
- Se detectó que el script `migrate:categories` apunta a un archivo que no existe; retirarlo o crear el script antes de anunciarlo como disponible.

Estas correcciones no se consideran validadas hasta que pase CI para el commit correspondiente. Las credenciales y el smoke test autenticado requieren acceso a los proveedores reales.

## Evidencia actual

La ejecución anterior de CI pasó lint, tests, reglas Firestore, build y typecheck API para el commit `2f3701e`. Ese resultado no certifica los cambios posteriores. La suite de checkout usa mocks para el límite remoto; no es un checkout E2E contra Firebase de producción.

## Estado por área

| Área | Estado | Nota |
|---|---|---|
| Build / TypeScript frontend | Pendiente nueva CI | Ejecutar en el commit de cierre |
| TypeScript API | Pendiente nueva CI | Ejecutar en el commit de cierre |
| Lint y pruebas | Pendiente nueva CI | Ejecutar en el commit de cierre |
| Reglas Firestore | CI previo aprobado | Volver a validar tras cambios |
| Checkout / órdenes | Implementado en código | Falta compra autenticada real |
| S3 presigned POST | Implementado en código | Bucket, CORS y lectura requieren smoke test externo |
| Vercel | Parcial | Confirmar deployment del commit final y probar flujos autenticados |
| Variables de entorno | No verificables desde el repo | Verificar proyecto y scopes en Vercel/Firebase/AWS |

## Variables que hay que verificar en el proveedor

Frontend Firebase: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.

Server-only: `FIREBASE_WEB_API_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON` o variables divididas, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_REGION` y `ALLOWED_ORIGINS`.

No registrar valores secretos en logs, README, issues o commits. `.env.example` debe contener solo nombres y ejemplos no sensibles.

## Pasos restantes fuera del código

1. Confirmar email/password y Google Auth, dominios autorizados, reglas e índices en el Firebase correcto.
2. Confirmar en Vercel el proyecto conectado `rechimonths-projects/e-commerce` y variables Production.
3. Probar `https://e-commerce-mauve-one-98.vercel.app/api/health`.
4. Completar smoke test autenticado customer/admin siguiendo `docs/audit-matrix.md`.
5. Probar subida S3 real, CORS y visualización de la imagen.
6. Registrar solo resultados observados, sin tokens ni secretos.

**Criterio de cierre:** no marcar producción como totalmente verificada hasta completar esos pasos con credenciales reales.