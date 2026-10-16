# Configuración local

## Requisitos

- Node.js 24.x (ver `engines` en `package.json`).
- Proyecto Firebase de desarrollo y, para probar uploads, un bucket S3 de desarrollo.
- Vercel CLI para ejecutar localmente las funciones serverless `/api/*`.

## Preparación

1. Copia `.env.example` como `.env`.
2. Completa `VITE_FIREBASE_*` con la configuración de la Web App Firebase.
3. Configura las variables server-only necesarias: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (o `FIREBASE_SERVICE_ACCOUNT_JSON`), `FIREBASE_WEB_API_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_REGION` y `ALLOWED_ORIGINS` cuando corresponda.
4. Usa credenciales de desarrollo, nunca las de producción, y no subas `.env` al repositorio.

## Ejecutar frontend y API

```bash
npm ci
npx vercel dev
```

Usa `npx vercel dev` para probar los endpoints `/api/*`: `npm run dev` ejecuta Vite, pero no reproduce el runtime de las funciones serverless de Vercel. Para trabajar solo sobre la interfaz, `npm run dev` sigue siendo válido.

## Verificación antes de desplegar

```bash
npm run lint
npm test
npx --yes firebase-tools emulators:exec --only firestore --project e-commerce-ai-test "npm run test:rules"
npm run typecheck:api
npm run build
```

Las pruebas automatizadas no demuestran por sí mismas que las credenciales reales, la subida S3 o el checkout autenticado de producción funcionen. Después del deploy, prueba con cuentas customer/admin de prueba y verifica persistencia tras recargar.

**Nunca compartas valores secretos en logs, capturas o tickets.**
