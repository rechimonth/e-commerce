# Production Readiness Review — E-Commerce

> **Fecha**: 15/8/2026  
> **Revisor**: Kilo (Release Engineer)  
> **Alcance**: Build, tests, lint, variables, Vercel, Firebase, AWS, flujos de aplicación.  
> **Principio**: No declarar algo como funcionando si no existe evidencia.

---

## Resumen ejecutivo

| Área | Estado | Bloquea release |
|------|--------|-----------------|
| **Build** | ❌ FALLA | SÍ |
| **Lint** | ❌ FALLA | SÍ |
| **Tests** | ⚠️ 53 fallos / 397 tests | SÍ |
| **Variables de entorno** | ⚠️ .env con valores reales | SÍ |
| **Vercel** | ⚠️ Falta config de env vars | SÍ |
| **Firebase Rules** | ✅ Completo | No |
| **AWS S3** | ✅ Presigned URLs | No |
| **Flujos customer** | ✅ Implementados | No |
| **Flujos admin** | ✅ Implementados | No |

**Conclusión**: El proyecto **NO está listo para producción**. Existen bloqueos críticos en build, lint, tests y configuración de secrets.

---

## 1. Build

### npm run build

**Resultado**: ❌ FALLA

```
src/test/mocks/firebase.ts(33,10): error TS1005: ',' expected.
src/test/mocks/firebase.ts(51,10): error TS1005: ',' expected.
src/test/mocks/firebase.ts(52,10): error TS1005: ',' expected.
src/test/mocks/firebase.ts(53,10): error TS1005: ',' expected.
```

**Causa raíz**: `src/test/mocks/firebase.ts` contiene sintaxis TypeScript inválida:
- Línea 33: `type User: class User {}` — inválido. Debería ser `User: class User {}` o usar un tipo diferente.
- Líneas 51-53: `type Firestore: class Firestore {}`, `type DocumentData: class DocumentData {}`, `type QueryDocumentSnapshot: class QueryDocumentSnapshot {}` — mismo error.

**Impacto**: Bloquea cualquier pipeline de CI/CD que ejecute `tsc --noEmit` antes de deploy.

**Evidencia**: Ejecutado `npm run build` el 15/8/2026 — falla con 4 errores TS1005.

---

## 2. Tests

### npm run test

**Resultado**: ⚠️ 53 fallos de 397 tests (14 archivos fallidos)

### Resumen de fallos

| Archivo | Fallos | Causa raíz |
|---------|--------|------------|
| `tests/unit/infrastructure/firestore.test.ts` | 16 | `vi.resetModules()` rompe `getApps()` — mock de Firebase hoisted no persiste |
| `tests/unit/infrastructure/auth.test.ts` | 8 | Mismo issue que firestore.test.ts |
| `tests/unit/contexts/AuthProvider.test.tsx` | 2 | Timing en `observeAuthState` — `signIn` no setea usuario antes de assert |
| `tests/unit/api/upload.test.ts` | 9 | `res.setHeader is not a function` — mock de `VercelResponse` incompleto |
| `tests/unit/components/AdminProductsPage.test.tsx` | 4 | Encode de acentos en tests (AdminProductsPage), `getByRole` con texto roto |
| `tests/unit/pages/CartPage.test.tsx` | 1 | Encode de acentos en DOM (`está` se renderiza como `está`) |
| `tests/unit/admin/AdminProductFormPage.test.tsx` | 1 | `import()` type annotation — regla ESLint forbid |
| `tests/unit/admin/AdminOrderDetailPage.test.tsx` | 1 | Texto roto por encoding (`Informaciónón`, `Envíoío`) |
| `tests/unit/admin/DashboardPage.test.tsx` | 1 | Texto roto por encoding (`Ver órdenes`) |
| `tests/unit/components/Cart.test.tsx` | 2 | Encode de acentos |
| `tests/unit/components/Checkout.test.tsx` | 2 | Encode de acentos |
| `tests/integration/app-routing.test.tsx` | 2 | Pre-existente |
| `tests/integration/flow.test.tsx` | 3 | Pre-existente |
| `tests/integration/components.test.tsx` | 1 | Pre-existente |

### Categorización de fallos

**Bloqueantes (deben arreglarse antes de release)**:
1. `firestore.test.ts` — 16 fallos por `vi.resetModules()` + `getApps()`
2. `auth.test.ts` — 8 fallos por mismo issue
3. `upload.test.ts` — 9 fallos por mock incompleto de `VercelResponse`

**Importantes**:
4. `AuthProvider.test.tsx` — 2 fallos por timing en mocks
5. `AdminProductsPage.test.tsx` — 4 fallos por encoding

**Menor**:
6. Tests de páginas con acentos en texto — 7 fallos por encoding de caracteres especiales en archivos de test

### Evidencia de ejecución

```
Test Files: 14 failed | 37 passed (51)
Tests: 53 failed | 344 passed (397)
Duration: ~300s
```

---

## 3. Lint

### npm run lint

**Resultado**: ❌ 25 errores, 0 warnings

### Desglose de errores

| Archivo | Errores | Tipo |
|---------|---------|------|
| `src/test/fixtures.ts` | 7 | `@typescript-eslint/no-unused-vars` — imports sin usar |
| `src/test/mocks/firebase.ts` | 1 | Parsing error — sintaxis inválida |
| `tests/integration/flow.test.tsx` | 3 | Unused vars (`waitFor`, `userEvent`, `ordersService`) |
| `tests/unit/admin/AdminProductFormPage.test.tsx` | 1 | `@typescript-eslint/consistent-type-imports` — `import()` type |
| `tests/unit/admin/AdminProductsPage.test.tsx` | 1 | Unused import (`fireEvent`) |
| `tests/unit/api/upload.test.ts` | 9 | `@typescript-eslint/no-explicit-any` — 9 usos de `any` |
| `tests/unit/hooks/useCart.test.tsx` | 2 | Unused imports (`CartContext`, `CartContextValue`) |
| `tests/unit/pages/CatalogPage.test.tsx` | 1 | Unused import (`userEvent`) |

**Nota**: 22 de 25 errores están en archivos de **tests**, no en código de producción.

---

## 4. Variables de entorno

### .env

**Estado**: ⚠️ EXISTE con valores reales

**Contenido** (redactado):
```
VITE_API_BASE_URL=http://localhost:5173
VITE_FIREBASE_API_KEY=***REDACTED***
VITE_FIREBASE_AUTH_DOMAIN=***REDACTED***
VITE_FIREBASE_PROJECT_ID=***REDACTED***
VITE_FIREBASE_STORAGE_BUCKET=***REDACTED***
VITE_FIREBASE_MESSAGING_SENDER_ID=***REDACTED***
VITE_FIREBASE_APP_ID=***REDACTED***
VITE_AWS_REGION=***REDACTED***
VITE_AWS_S3_BUCKET=***REDACTED***
```

**Verificación**:
- `.env` está en `.gitignore` ✅
- `.env.example` existe ✅
- No hay `.env.local`, `.env.production` ✅

**Riesgo**: Aunque `.env` está gitignored, su presencia en el workspace con valores reales es un riesgo si:
- El workspace se comparte o respalda sin excluir `.env`
- Se hace `cat .env` en logs de CI
- Un developer comete `.env` en un commit fuera del repo (e.g., snippet sharing)

### VITE_* únicamente frontend

✅ Todas las variables en `.env` usan prefijo `VITE_*`. Esto significa:
- Son públicas — se empaquetan en el bundle de JavaScript
- **NO deben contener secrets** (API keys de Firebase son públicas por diseño; no son secrets)

### Secretos AWS server-side

✅ En `api/upload.ts` se usan `process.env.AWS_ACCESS_KEY_ID`, `process.env.AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_REGION`.
✅ Estos NO están en `.env` (deberían estar en Vercel Environment Variables).

### process.env en Functions

✅ `api/upload.ts` usa correctamente `process.env.*` para:
- `VERCEL_URL` — para CORS dinámico
- `NODE_ENV` — para determinar origen CORS
- `AWS_S3_BUCKET`, `AWS_REGION` — configuración S3
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — credenciales AWS

---

## 5. Vercel

### vercel.json

**Estado**: ✅ Existe

```json
{
  "version": 2,
  "builds": [
    { "src": "package.json", "use": "@vercel/static-build", "config": { "distDir": "dist" } },
    { "src": "api/**/*.ts", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1.ts" },
    { "src": "/(.*)", "dest": "/" }
  ]
}
```

### Build

✅ Configurado como `@vercel/static-build` con `distDir: "dist"`.
✅ Comando de build en `package.json`: `tsc --noEmit && vite build`.

### Runtime

✅ Node.js runtime implícito en `@vercel/node`.
⚠️ No se especifica `engines.node` en `package.json`.

### Functions

✅ `/api/upload.ts` es una Vercel Serverless Function.
✅ Usa `VercelRequest` y `VercelResponse` de `@vercel/node`.
✅ CORS headers implementados en `setCorsHeaders()`.

### Environment Variables

⚠️ **FALTA CONFIGURAR** en Vercel:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `AWS_REGION`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

**Nota**: Las variables `VITE_*` deben configurarse en Vercel como **Environment Variables** (no en código). Las variables `AWS_*` deben ser **Serverless Function Environment Variables** (secrets).

---

## 6. Firebase

### Auth

✅ Firebase Auth configurado en `src/infrastructure/firebase/config.ts`.
✅ `observeAuthState` para estado de autenticación en tiempo real.
✅ `signInWithEmail`, `signUpWithEmail`, `signInWithGoogle`, `signOut` implementados en `src/infrastructure/firebase/auth.ts`.
✅ Roles (customer/admin) gestionados en perfil de Firestore.

### Firestore

✅ Firestore configurado en `src/infrastructure/firebase/firestore.ts`.
✅ Operaciones CRUD para productos y órdenes.
✅ DTOs tipados (`ProductDTO`, `OrderDTO`).
✅ Adaptadores DTO → Entity en capa de servicios.

### Rules

✅ `firestore.rules` existe y es comprehensivo:
- Validación de precios (no-negativos, enteros)
- Validación de items de orden (cantidad >= 1)
- Validación de campos permitidos (`productAllowedFields`, `orderAllowedFields`, `userAllowedFields`)
- `isAdmin()`, `isOwner()`, `isOrderOwner()` helpers
- Customer no puede auto-asignarse rol admin
- Customer no puede cambiar estado de órdenes
- Solo admin puede listar todas las órdenes
- Catch-all deny

### Indexes

⚠️ **No se encontró archivo `firestore.indexes.json`** ni evidencia de índices compuestos configurados.

**Requeridos para**:
- `orders` collection: `userId` + `createdAt` (para `getUserOrders`)
- `orders` collection: `status` + `createdAt` (para `getAllOrders` con filtro)
- `products` collection: `category` + `isActive` + `createdAt` (para `getProducts` con filtros)

**Evidencia**: Firestore queries en `firestore.ts` usan `orderBy('createdAt', 'desc')` compuesto con `where`. Sin índices compuestos, estas queries fallarán en producción con `FAILED_PRECONDITION`.

---

## 7. AWS

### S3

✅ Bucket configurado en variables de entorno.
✅ `api/upload.ts` genera presigned PUT URLs con `S3Client` y `PutObjectCommand`.
✅ ACL `private` configurado.
✅ Key pattern seguro: `${prefix}/${timestamp}-${random}.${extension}`.

### IAM

⚠️ **No hay evidencia de política IAM documentada**.

Requerido para el usuario/rol que ejecuta la función:
- `s3:PutObject` en el bucket (para upload)
- `s3:GetObject` si se requiere leer archivos
- `s3:PutObjectAcl` si se requiere ACL personalizado

### Presigned URLs

✅ Implementadas con `getSignedUrl` de `@aws-sdk/s3-request-presigner`.
✅ Expiración: 300 segundos (5 minutos).
✅ Solo método PUT (cliente sube archivo directamente).

### CORS

⚠️ **No se encontró configuración CORS de S3 documentada.**

El bucket S3 requiere configuración CORS para permitir PUT desde el dominio del frontend:
```xml
<CORSRule>
  <AllowedOrigin>https://tu-dominio.com</AllowedOrigin>
  <AllowedMethod>PUT</AllowedMethod>
  <AllowedHeader>*</AllowedHeader>
</CORSRule>
```

Sin esto, el upload directo a S3 fallará en el navegador con error CORS.

### Límites de upload

✅ Límite de 5MB implementado en `api/upload.ts` y `uploadService.ts`.
✅ Validación de extensión (jpg, jpeg, png, webp, gif).
✅ Validación de content type.
✅ Presigned URL expiry de 5 minutos.

---

## 8. Flujos de aplicación

### Customer flow

| Paso | Página | Estado |
|------|--------|--------|
| Ver catálogo | `CatalogPage` | ✅ |
| Buscar productos | `ProductSearch` | ✅ |
| Filtrar por categoría | `ProductFilters` | ✅ |
| Ver detalle de producto | `ProductDetailPage` | ✅ |
| Agregar al carrito | `CartItemRow` + `useCart` | ✅ |
| Ver carrito | `CartPage` | ✅ |
| Checkout | `CheckoutPage` | ✅ |
| Confirmar pedido | `useCheckout` + `ordersService` | ⚠️ Simulado |
| Ver órdenes | `OrdersPage` | ✅ |
| Ver detalle de orden | `OrderDetailPage` | ✅ |

### Admin flow

| Paso | Página | Estado |
|------|--------|--------|
| Dashboard | `AdminDashboardPage` | ✅ |
| Gestionar productos | `AdminProductsPage` | ✅ |
| Crear producto | `AdminProductFormPage` | ✅ |
| Editar producto | `AdminProductFormPage` | ✅ |
| Eliminar producto | Modal en `AdminProductsPage` | ✅ |
| Gestionar órdenes | `AdminOrdersPage` | ✅ |
| Ver detalle de orden | `AdminOrderDetailPage` | ✅ |
| Cambiar estado de orden | Select en `AdminOrdersPage` | ✅ |
| Subir imagen | `ImageUploader` | ⚠️ Depende de AWS config |

### Checkout

✅ Formulario completo (shipping, billing, payment method, notes).
✅ Validación HTML5 (`required` en campos).
✅ `useCheckout` maneja estados idle/loading/success/error.
✅ `checkoutService` simula procesamiento de pago.
⚠️ **No hay integración real con pasarela de pago** (Stripe, PayPal, etc.) — simulado con delay.

### Orders

✅ Creación de orden desde checkout.
✅ Listado de órdenes del usuario.
✅ Detalle de orden con items, precios, estado.
✅ Cambio de estado por admin.
✅ Firestore rules validan transiciones de estado.

### CRUD

✅ Productos: create/read/update/delete desde admin.
✅ Órdenes: read/update status desde admin.
✅ Firestore rules restringen operaciones por rol.

### Upload

✅ Frontend: `useUpload` + `ImageUploader` component.
✅ Backend: `/api/upload` Vercel Function.
✅ Presigned URL a S3.
✅ Validaciones de tamaño, tipo, extensión.
⚠️ Depende de configuración CORS de S3 y variables de entorno AWS.

---

## 9. Checklist pre-deployment

### Bloqueantes (deben resolverse)

- [ ] **Build**: Arreglar sintaxis inválida en `src/test/mocks/firebase.ts` o excluir `src/test` de `tsconfig.json`
- [ ] **Lint**: Resolver 25 errores (principalmente unused imports y parsing errors)
- [ ] **Tests**: Resolver 53 fallos
  - [ ] `firestore.test.ts`: Corregir `vi.resetModules()` para no romper `getApps()`
  - [ ] `auth.test.ts`: Mismo fix
  - [ ] `upload.test.ts`: Completar mock de `VercelResponse` con `setHeader`
  - [ ] Encoding: Normalizar acentos en archivos de test (UTF-8 BOM o normalización)
- [ ] **Variables**: Remover `.env` del workspace o asegurar que nunca se expone en CI
- [ ] **Vercel**: Configurar todas las environment variables en dashboard de Vercel
- [ ] **Firestore indexes**: Crear `firestore.indexes.json` con índices compuestos requeridos
- [ ] **S3 CORS**: Configurar CORS en bucket S3 para permitir PUT desde dominio frontend
- [ ] **AWS IAM**: Documentar política IAM para la función Vercel

### Importantes (deberían resolverse)

- [ ] **AuthProvider tests**: Corregir timing en mocks de `observeAuthState`
- [ ] **AdminProductsPage tests**: Normalizar encoding de acentos en texto de componente y tests
- [ ] **CI/CD**: Configurar pipeline que ejecute `build`, `lint`, `test` y falle si cualquiera falla
- [ ] **Firebase emulator**: Agregar script `docker-compose` o `npm run emulators` para desarrollo local
- [ ] **Error boundaries**: Agregar React Error Boundary en `App.tsx` para capturar crashes en runtime

### Deseables

- [ ] **renderWithProviders**: Usar consistentemente en lugar de wrappers inline
- [ ] **fixtures**: Migrar fixtures inline a `src/test/fixtures.ts`
- [ ] **userEvent**: Migrar tests antiguos de `fireEvent` a `userEvent`
- [ ] **Monitoring**: Agregar Sentry o similar para error tracking en producción
- [ ] **Rate limiting**: En `/api/upload` para prevenir abuso
- [ ] **Rate limiting Firebase**: Configurar quotas en Firebase Console
- [ ] **Backup Firestore**: Configurar export automático de backups

---

## 10. Evidencia de comandos ejecutados

```
npm run build
> tsc --noEmit && vite build
❌ FALLA — 4 errores TS1005 en src/test/mocks/firebase.ts

npm run lint
> eslint . --max-warnings=0
❌ FALLA — 25 errores (0 warnings)

npm run test
> vitest run
⚠️ 14 archivos fallidos, 53 tests fallidos de 397 totales
```

---

*Generado por Kilo — Production Readiness Review — 15/8/2026*