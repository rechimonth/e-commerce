# ECOMMERCE AI

![ECOMMERCE AI](https://img.shields.io/badge/ECOMMERCE_AI-React%2018%20%2B%20TypeScript%20%2B%20Vite-blue)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-orange)
![AWS S3](https://img.shields.io/badge/AWS%20S3-Presigned%20POST-green)
![Vercel](https://img.shields.io/badge/Vercel-Serverless%20Functions-black)

Aplicación SPA de e-commerce para retail. Los clientes consultan el catálogo, administran su carrito y realizan un checkout simulado; los administradores gestionan productos, órdenes y contenido desde un panel protegido.

- **Producción:** https://e-commerce-mauve-one-98.vercel.app/
- **Repositorio:** https://github.com/rechimonth/e-commerce
- **Rama:** main
- **Stack:** React 18, TypeScript, Vite, Firebase Authentication, Firestore, AWS S3 y Vercel Functions.

---

## 📋 Sobre el proyecto

ECOMMERCE AI responde al proyecto integrador de una plataforma de comercio electrónico con dos roles diferenciados:

- **Cliente (customer):** navega el catálogo, administra el carrito, confirma compras y consulta sus órdenes.
- **Administrador (admin):** mantiene el catálogo, sube imágenes, consulta órdenes y gestiona su estado.

El checkout simula el pago; no procesa cargos reales con una pasarela.

---

## 🎯 Objetivo

- Separar UI, lógica de negocio, servicios e infraestructura.
- Usar Firebase Authentication para identidad y Firestore para perfiles, productos, órdenes y reseñas.
- Subir imágenes a S3 con una política temporal firmada generada por una Vercel Function.
- Proteger operaciones según rol tanto en rutas frontend como en el backend y las reglas de Firestore.
- Validar cambios con ESLint, TypeScript, Vitest, React Testing Library y pruebas de reglas con Firebase Emulator.
- Documentar instalación, decisiones y uso de IA sin incluir secretos.

---

## 🛒 ¿Qué puedo hacer?

### Como cliente

1. Registrarse o iniciar sesión con email/contraseña; el inicio con Google está integrado.
2. Explorar, buscar y filtrar productos por categoría.
3. Ver detalles y reseñas de productos.
4. Agregar productos al carrito, modificar cantidades y eliminarlos.
5. Confirmar un checkout con datos de envío y método de pago simulado.
6. Consultar el historial y detalle de sus órdenes.
7. Cancelar una orden que todavía esté en estado pending, cuando se cumplan las validaciones del servidor.
8. Consultar seguimiento y descargar adjuntos mediante URLs temporales autorizadas.

### Como administrador

1. Acceder al panel protegido por rol.
2. Consultar el dashboard.
3. Crear, editar, activar/desactivar y eliminar productos.
4. Subir imágenes de productos a S3.
5. Consultar y filtrar órdenes.
6. Actualizar estados y datos de seguimiento.
7. Crear órdenes para un cliente desde el flujo administrativo.
8. Gestionar usuarios/categorías y consultar las páginas de analytics y configuración disponibles.

---

## 🎮 Categorías

| Categoría | Descripción |
|---|---|
| Videojuegos | Productos relacionados con videojuegos. |
| Figuras de acción | Figuras y coleccionables. |
| Zapatillas | Calzado y modelos disponibles. |

---

## ✨ Funcionalidades

### Cliente

- Registro, inicio/cierre de sesión y persistencia de sesión con Firebase Auth.
- Catálogo Firestore con filtros, búsqueda con debounce, detalle y paginación.
- Carrito global con Context API + useReducer.
- Checkout simulado con validación del lado del servidor, revalidación de precios y actualización de stock.
- Historial, detalle y cancelación permitida de órdenes.
- Reseñas limitadas a clientes que hayan comprado el producto en una orden completada.
- Estados de carga, vacíos y errores visibles.

### Administrador

- Rutas protegidas por rol y comprobaciones de rol en operaciones privilegiadas.
- CRUD de productos con paginación.
- Subida de imágenes mediante presigned POST a S3.
- Gestión de órdenes y actualización de estado/seguimiento mediante API serverless.
- Adjuntos privados de órdenes con descarga firmada de duración limitada.
- Dashboard y vistas administrativas complementarias.

### Seguridad y consistencia de negocio

- La creación de órdenes se realiza a través de una función de servidor; las reglas de Firestore deniegan la creación directa desde el cliente.
- El servidor revalida datos del pedido y gestiona stock en una transacción.
- La cancelación verifica propietario y estado, y repone stock dentro de una transacción.
- Las reseñas se escriben desde el backend; el cliente no puede escribir directamente en las colecciones de reseñas.
- Las credenciales de AWS nunca deben llevar el prefijo VITE_ ni exponerse en el bundle del navegador.

---

## 🧩 Cómo funciona

La solución se divide en tres capas principales:

1. **Frontend:** React + TypeScript + Vite para páginas, rutas, componentes y estado global.
2. **BaaS:** Firebase Authentication gestiona identidad y Firestore persiste perfiles, productos, órdenes y reseñas.
3. **Backend serverless:** Vercel Functions valida tokens/roles y realiza operaciones privilegiadas, incluida la firma de solicitudes S3.

Flujo de compra:

1. El cliente se autentica y agrega productos al carrito.
2. El frontend envía los productos solicitados al endpoint de checkout con su token Firebase.
3. El backend valida identidad, datos, productos, precios y stock.
4. La orden se guarda en Firestore mediante una transacción.
5. El carrito se limpia cuando el checkout finaliza correctamente; si falla, se muestra un error.

Flujo de imágenes de producto:

1. Un administrador autenticado selecciona la imagen en el panel.
2. El frontend envía nombre, MIME type, tamaño y token Firebase a POST /api/upload.
3. La función valida el token, consulta el perfil y exige rol admin.
4. La función crea una presigned POST con clave aleatoria, tipo de contenido permitido y límite de 5 MB.
5. El navegador envía el archivo y los campos firmados directamente a S3.
6. La UI recibe la clave y URL de producto; al guardar el formulario, imageKey, imageUrl e imágenes asociadas se persisten en el documento del producto en Firestore.

La función /api/upload no guarda por sí sola el documento del producto: la persistencia de metadatos ocurre cuando se guarda el producto desde el panel.

---

## 🏗️ Arquitectura

- src/pages: pantallas de cliente y administración.
- src/components: componentes reutilizables de UI y layout.
- src/hooks: lógica reutilizable de autenticación, carrito, órdenes, productos y uploads.
- src/contexts: contexto de autenticación.
- src/store/cart: carrito con Context API + reducer.
- src/services: casos de uso para productos, checkout, órdenes y uploads.
- src/infrastructure/firebase: adaptadores y acceso a Firebase/Firestore.
- src/types: tipos e interfaces del dominio y API.
- src/utils: utilidades puras.
- server: inicialización server-only de Firebase Admin.
- api: Vercel Serverless Functions.
- tests: pruebas unitarias, de integración y seguridad.

La lógica de negocio no debe depender directamente de la presentación. Las operaciones privilegiadas se mantienen en el backend o en reglas de Firestore, no solamente en los controles de la interfaz.

---

## 📁 Estructura del proyecto

~~~
src/
├── app/                    # Enrutamiento y providers globales
├── components/
│   ├── admin/              # Layout y componentes administrativos
│   ├── auth/               # Protección de rutas por autenticación/rol
│   ├── cart/               # Componentes del carrito
│   ├── catalog/            # Catálogo, búsqueda y filtros
│   ├── common/             # Estados de carga, vacíos y errores
│   ├── layout/             # Header y estructura general
│   ├── ui/                 # Controles reutilizables
│   └── upload/             # Selector y preview de imágenes
├── config/                 # Configuración de Firebase
├── constants/              # Rutas y constantes
├── contexts/               # Contexto de autenticación
├── hooks/                  # Hooks de aplicación
├── infrastructure/firebase/# Adaptadores Auth y Firestore
├── pages/                  # Páginas de cliente y admin
├── services/               # Servicios de dominio
├── store/cart/             # Reducer y provider del carrito
├── test/                   # Setup, fixtures, mocks y providers
├── types/                  # Tipos del dominio
└── utils/                  # Funciones auxiliares

api/
├── checkout.ts             # Creación validada de órdenes
├── cancel-order.ts         # Cancelación y reposición de stock
├── update-order-status.ts  # Actualización administrativa de órdenes
├── upload.ts               # Presigned POST para S3
├── order-attachment.ts     # Descarga autorizada de adjuntos
├── reviews.ts              # Escritura validada de reseñas
└── health.ts               # Health check

server/
└── firebaseAdmin.ts        # Inicializador de Firebase Admin para servidor

tests/
├── integration/            # Flujos de usuario
└── unit/                   # Hooks, servicios, UI, API y seguridad

firestore.rules             # Reglas de acceso a Firestore
firestore.indexes.json      # Índices compuestos
firebase.json               # Configuración del emulador
vercel.json                 # Hosting, SPA y cabeceras HTTP
.env.example                # Nombres de variables, sin secretos
~~~

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| React 18 | Interfaz de usuario |
| TypeScript | Tipado estático |
| Vite | Desarrollo y build del frontend |
| React Router | Navegación |
| Tailwind CSS 4 | Estilos responsivos |
| Context API + useReducer | Estado del carrito |
| Firebase Authentication | Identidad de usuario |
| Cloud Firestore | Productos, perfiles, órdenes y reseñas |
| Firebase Admin SDK | Validación y operaciones privilegiadas del backend |
| AWS SDK for JavaScript v3 + S3 | Subida de archivos y URLs firmadas |
| Vercel Serverless Functions | Endpoints de backend |
| Vitest + React Testing Library | Pruebas unitarias e integración |
| Firebase Emulator + Rules Unit Testing | Pruebas de reglas de seguridad |
| ESLint | Calidad estática del código |

---

## 🔐 Seguridad

- .env, .env.local y otros archivos locales de entorno deben permanecer ignorados por Git.
- .env.example contiene nombres de variables y valores vacíos/de ejemplo, nunca secretos.
- Las credenciales AWS se usan únicamente en funciones serverless.
- El endpoint de upload exige un token Firebase válido y un perfil users/{uid} con role: "admin".
- Las reglas de Firestore impiden que un usuario se otorgue el rol admin al registrarse; el alta normal crea perfiles customer.
- El cliente solo puede leer/actualizar sus propios datos permitidos y sus órdenes; las operaciones de administración se validan con rol.
- La creación directa de órdenes desde el navegador está denegada por reglas; se usa la función de checkout.
- Los adjuntos de órdenes se sirven mediante URLs firmadas temporales después de comprobar pertenencia o rol admin.
- vercel.json configura CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy y Permissions-Policy.

**Importante:** la protección de rutas en el frontend mejora la experiencia, pero no sustituye la validación del servidor ni las reglas de Firestore.

---

## 🔥 Firebase

Firebase se usa para:

1. **Authentication:** email/contraseña, inicio con Google, cierre de sesión y persistencia.
2. **Firestore:** perfiles, catálogo, órdenes, reseñas y metadatos asociados.
3. **Roles:** cada usuario tiene un documento users/{uid} con campo role (customer o admin).

El flujo de registro crea el perfil con rol customer; las reglas no permiten que el usuario elija admin al crear su propio perfil. Para conceder acceso administrativo, un operador autorizado debe asignar ese rol de forma segura en Firestore.

Las reglas están en firestore.rules. Los cambios de reglas e índices se pueden publicar con:

~~~
npx firebase-tools deploy --only firestore:rules,firestore:indexes
~~~

Antes de publicar reglas, ejecutar las pruebas con el emulador como se indica en la sección Tests.

---

## ☁️ AWS / S3

El código utiliza una **presigned POST** (no PUT) generada por api/upload.ts.

- Expiración de la política firmada: 300 segundos.
- Tamaño máximo validado: 5 MB.
- Formatos de imagen admitidos: JPEG, PNG, WebP y GIF.
- PDF admitido solo para adjuntos de órdenes.
- La extensión y el MIME type deben coincidir.
- Las claves de objeto se generan en el servidor bajo products/ o orders/; el cliente no elige una ruta arbitraria.
- Los adjuntos de órdenes se descargan con una URL firmada temporal y comprobación de permisos.

### Configuración obligatoria del bucket

Para que el flujo funcione desde un navegador, **CORS del bucket debe permitir el origen de la aplicación y el método POST**. Configura una regla equivalente a esta en S3 y adapta los orígenes al dominio real:

~~~json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD", "POST"],
    "AllowedOrigins": [
      "https://e-commerce-mauve-one-98.vercel.app",
      "http://localhost:5173",
      "http://localhost:3000"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
~~~

Los dominios de preview de Vercel deben añadirse explícitamente si se van a usar para probar uploads.

### Lectura de imágenes y privacidad

El código persiste una URL HTTPS directa de S3 para las imágenes de productos. Esa URL solo será visible para el público si el bucket/política permite lectura de los objetos bajo products/*. Si se opta por lectura pública, limita la política exclusivamente a ese prefijo y no habilites lectura pública para orders/*. Los adjuntos de órdenes deben permanecer privados y descargarse a través de /api/order-attachment.

No publiques claves AWS en el repositorio ni en variables VITE_*. Usa una credencial IAM dedicada, con permisos mínimos para el bucket y los objetos necesarios. Después de una exposición accidental, revoca la clave afectada y crea una nueva.

Más detalle técnico: [docs/UPLOAD_FLOW.md](docs/UPLOAD_FLOW.md).

---

## 🚀 Instalación

### Requisitos previos

- Git.
- Node.js **24.x** (versión declarada en package.json).
- npm incluido con Node.js.
- Proyecto Firebase con Authentication y Firestore habilitados.
- Bucket S3 y credenciales IAM con permisos limitados.
- Vercel CLI para ejecutar localmente las funciones serverless.

Comprueba las versiones:

~~~
node --version
npm --version
~~~

### 1. Clonar el repositorio

~~~
git clone https://github.com/rechimonth/e-commerce.git
cd e-commerce
git switch main
~~~

### 2. Instalar dependencias

~~~
npm ci
~~~

Si npm informa una inconsistencia del lockfile, revisa el cambio y vuelve a generar el lockfile deliberadamente; no borres archivos de lock automáticamente.

### 3. Configurar variables de entorno

Copia el archivo de ejemplo.

**Linux/macOS**
~~~
cp .env.example .env
~~~

**Windows PowerShell**
~~~
Copy-Item .env.example .env
~~~

Completa las variables locales con credenciales propias. No copies secretos a GitHub ni a este README.

### 4. Ejecutar solo el frontend

~~~
npm run dev
~~~

Abre la URL que indique Vite, normalmente http://localhost:5173. Este comando sirve el frontend; para probar las rutas /api/* también debes iniciar Vercel localmente.

### 5. Ejecutar frontend + funciones serverless de Vercel (recomendado)

Esta aplicación contiene archivos `api/*.ts`; para probar checkout, usuarios y uploads localmente, utiliza `vercel dev`, no solo `npm run dev`.

**Primera configuración en este equipo (una sola vez):**

```bash
npx vercel@latest login
npx vercel@latest link
```

Cuando `vercel link` pregunte, selecciona el equipo/proyecto de Vercel existente **`rechimonths-projects / e-commerce`**. No crees otro proyecto ni elijas otro proyecto con nombre parecido. La carpeta `.vercel/` identifica el vínculo local y está excluida por Git.

**Cada vez que quieras iniciar la aplicación local:**

```bash
npx vercel@latest pull --yes --environment=development
npx vercel@latest dev --listen 3000
```

Abre http://localhost:3000. El comando `vercel dev` sirve la SPA y las funciones de `api/`. El `pull` descarga la configuración y variables del entorno **Development** del proyecto vinculado. Configura las variables de Development en Vercel; no pegues credenciales de producción en el código ni en el README.

Si solo necesitas el frontend y no vas a probar funciones serverless, puedes ejecutar `npm run dev` y abrir la URL que imprima Vite (normalmente http://localhost:5173). En ese modo las llamadas a `/api/*` no se ejecutan como funciones locales de Vercel.

Si el puerto 3000 ya está ocupado, detén la otra instancia con `Ctrl+C` antes de volver a iniciar `vercel dev`.

### 6. Configurar Firebase

En Firebase Console:

1. Habilita los proveedores de Authentication que se vayan a utilizar (Email/Password y Google).
2. Crea/selecciona la base de datos Firestore.
3. Autoriza el dominio local y el dominio de producción en Authentication → Settings → Authorized domains.
4. Publica reglas e índices cuando las pruebas locales estén aprobadas.

Para ejecutar el emulador de reglas, instala/usa Firebase CLI y sigue la sección Tests.

### 7. Configurar AWS S3

1. Crea o selecciona el bucket en la región correcta.
2. Configura CORS según la sección AWS/S3.
3. Decide explícitamente cómo se leerán las imágenes de producto. Si se usa URL directa, permite lectura solo para products/*; deja orders/* privado.
4. Crea una credencial IAM dedicada con permisos mínimos de subida/lectura necesarios.
5. Guarda credenciales únicamente en variables server-only del entorno local y de Vercel.

### 8. Validar localmente

~~~
npm run lint
npm test
npm run build
npm run typecheck:api
~~~

Para las pruebas de reglas, consulta la sección Tests.

---

## 🔑 Variables de entorno

Usa los nombres siguientes. No rellenes el archivo de ejemplo con valores secretos.

| Variable | Uso | Dónde |
|---|---|---|
| VITE_FIREBASE_API_KEY | Configuración pública de Firebase Web | Frontend |
| VITE_FIREBASE_AUTH_DOMAIN | Dominio Auth | Frontend |
| VITE_FIREBASE_PROJECT_ID | ID del proyecto Firebase | Frontend |
| VITE_FIREBASE_STORAGE_BUCKET | Configuración del bucket Firebase Storage | Frontend |
| VITE_FIREBASE_MESSAGING_SENDER_ID | ID de mensajería | Frontend |
| VITE_FIREBASE_APP_ID | ID de la aplicación Firebase | Frontend |
| AWS_ACCESS_KEY_ID | Credencial AWS del backend | Solo servidor |
| AWS_SECRET_ACCESS_KEY | Secreto AWS del backend | Solo servidor |
| AWS_S3_BUCKET | Nombre del bucket S3 | Solo servidor |
| AWS_REGION | Región del bucket S3, por ejemplo sa-east-1 | Solo servidor |
| FIREBASE_SERVICE_ACCOUNT_JSON | Cuenta de servicio JSON completa; opción preferida para Firebase Admin | Solo servidor |
| FIREBASE_PROJECT_ID | ID de Firebase Admin si se usan variables separadas | Solo servidor |
| FIREBASE_CLIENT_EMAIL | Email de la cuenta de servicio | Solo servidor |
| FIREBASE_PRIVATE_KEY | Clave privada de la cuenta de servicio | Solo servidor |
| FIREBASE_WEB_API_KEY | API key Web usada por endpoints que validan tokens con Identity Toolkit; puede recurrir a VITE_FIREBASE_API_KEY | Servidor |
| ALLOWED_ORIGINS | Orígenes permitidos por la función upload, separados por coma | Solo servidor |

En Vercel, configura variables server-only para Production, Preview y/o Development según los entornos que uses. Después de cambiar variables, crea un nuevo deployment para que el runtime las reciba. ALLOWED_ORIGINS controla CORS de la API; la configuración CORS de S3 es independiente.

---

## 🧪 Tests

Ejecuta la validación principal:

~~~
npm run lint
npm test
npm run build
npm run typecheck:api
~~~

Las pruebas unitarias y de integración usan Vitest y React Testing Library. Firebase/AWS se mockean cuando corresponde para que la suite no dependa de servicios reales.

Para probar las reglas de Firestore:

1. Asegúrate de tener Java instalado (lo requiere el emulador).
2. Ejecuta las reglas con Firebase Emulator:

~~~
npx firebase-tools emulators:exec --only firestore "npm run test:rules"
~~~

Los tests de seguridad cubren accesos de usuarios autenticados/no autenticados, separación de roles, datos de productos y órdenes. El CI también ejecuta el emulador, el build y el typecheck de API.

**Estado verificado del CI:** consulta [la pestaña Actions](https://github.com/rechimonth/e-commerce/actions) para ver el resultado del último commit. El commit funcional `c9dcbec` fue validado con lint, 434 tests unitarios/de integración, 48 pruebas de reglas Firestore, build de producción y typecheck de API. Esto no sustituye una prueba end-to-end autenticada contra Firebase y AWS reales.

El script npm run test:coverage existe, pero antes de usarlo verifica que el proveedor de cobertura de Vitest esté instalado y fijado en el lockfile. No se presenta una cifra de cobertura sin un informe generado.

---

## 🌐 Deploy

El despliegue se realiza en Vercel con integración GitHub.

- vercel.json define dist como directorio de salida, el rewrite de SPA y cabeceras de seguridad.
- Las funciones serverless están en api/.
- Las variables de entorno se configuran en Project Settings de Vercel.
- El build de frontend ejecuta tsc --noEmit -p tsconfig.app.json y vite build.
- npm run typecheck:api verifica los tipos de las funciones serverless.

URL de producción:

https://e-commerce-mauve-one-98.vercel.app/

**Abrir y comprobar el deploy desde Git Bash:**

```bash
# La aplicación pública debe responder por HTTPS.
curl -I https://e-commerce-mauve-one-98.vercel.app/

# Health check público del backend serverless; debe devolver status=ok.
curl -fsS https://e-commerce-mauve-one-98.vercel.app/api/health
```

**Publicación normal de cambios:** Vercel está conectado a GitHub; después de editar y probar en la rama `main`, crea un commit descriptivo y envíalo. La integración de Vercel iniciará el despliegue automáticamente.

```bash
git status --short
git add <archivos-modificados>
git commit -m "fix: describe el cambio"
git push origin main
```

No hace falta ejecutar `vercel deploy --prod` para el flujo habitual conectado a GitHub. Después del push, revisa [GitHub Actions](https://github.com/rechimonth/e-commerce/actions) y el último deployment en Vercel. Abrir la URL y obtener `status: ok` valida el acceso básico, pero no reemplaza la prueba autenticada de checkout y subida real a S3.

---

## 📊 Cumplimiento de Proyecto 5

La tabla distingue entre implementación observada en el repositorio y pruebas reales de servicios externos. Un check de código no significa que se haya ejecutado un flujo real en producción.

### Requisitos funcionales

| Requisito | Estado de código | Evidencia principal |
|---|---|---|
| Registro email/contraseña y login/logout | Implementado | src/contexts/AuthProvider.tsx, src/infrastructure/firebase/auth.ts |
| Login con Google | Implementado en código | Auth provider |
| Roles customer/admin | Implementado | Perfil Firestore, rutas protegidas y reglas |
| Persistencia de sesión | Implementado | Auth provider |
| Catálogo, categoría, búsqueda y detalle | Implementado | Pages, hooks y services |
| Carrito y cálculo de total | Implementado | src/store/cart, utilidades y tests |
| Checkout simulado y creación de orden | Implementado en backend | api/checkout.ts |
| Historial y detalle de órdenes | Implementado | Páginas de órdenes |
| Cancelación y reposición de stock | Implementado en backend | api/cancel-order.ts |
| CRUD de productos | Implementado en código | src/services/productsService.ts, reglas Firestore |
| Subida de imagen a S3 | Implementación presente; falta validación real del bucket | api/upload.ts, src/services/uploadService.ts |
| Adjuntos de órdenes | Implementado en código | api/order-attachment.ts |
| Reseñas tras compra completada | Implementado en backend | api/reviews.ts |
| Rutas admin protegidas | Implementado y con tests | AdminRoute.tsx, tests de acceso |
| Reglas de seguridad Firestore | Tests CI en verde | firestore.rules, tests de reglas |
| Responsive, estados de carga y error | Implementado | Componentes comunes y páginas |

### Requisitos técnicos

| Requisito | Estado | Evidencia |
|---|---|---|
| React 18 + TypeScript + Vite | Configurado | package.json |
| React Router y Tailwind | Configurado | Dependencias y componentes |
| Context API + useReducer | Implementado | Auth context y cart reducer |
| Firebase Auth/Firestore | Implementado en código | src/infrastructure/firebase |
| AWS S3 con presigned POST | Implementado en código | api/upload.ts |
| Vercel Functions | Implementado | api/ |
| Vitest / React Testing Library | Configurado y ejecutado por CI | package.json |
| Pruebas de reglas Firestore | CI en verde | Firebase Emulator |

### Requisitos de documentación

| Requisito | Estado | Evidencia |
|---|---|---|
| README con instalación y configuración | Documentado | Este archivo |
| Variables sin secretos | Documentadas | .env.example |
| Flujo de upload S3 | Documentado | Sección AWS/S3 y docs/UPLOAD_FLOW.md |
| Bitácora de IA | Documentada en archivo separado | docs/ai-notes.md |
| URL de producción | Documentada | Sección Deploy |

---

## ⚠️ Problemas conocidos y verificaciones pendientes

1. **S3 no se puede declarar validado end-to-end solo por el código.** Falta comprobar con una sesión admin real que el bucket acepte el POST firmado, que su CORS permita el dominio y que las imágenes de products/* sean legibles mediante la URL guardada. La API genera una presigned POST, el frontend la usa correctamente y el producto persiste URL/clave al guardar.
2. **Credenciales:** si alguna clave AWS se compartió fuera del gestor de secretos, revócala y crea otra. No reutilices claves publicadas en conversaciones o logs.
3. **Roles reales:** las pruebas automatizadas verifican rutas y reglas, pero la comprobación de las cuentas concretas de producción requiere iniciar sesión con esas cuentas en el navegador y ejecutar operaciones reales. No se documentan contraseñas en este archivo.
4. **Cobertura:** verifica el proveedor @vitest/coverage-v8 y el lockfile antes de usar npm run test:coverage.
5. **CORS:** hay dos configuraciones separadas: ALLOWED_ORIGINS para la API de Vercel y CORS en el bucket S3.
6. **Reglas e índices:** después de modificar firestore.rules o firestore.indexes.json, hay que desplegarlos en el proyecto Firebase correcto.

---

## 🎓 Para presentar el proyecto

### Problema que resuelve

Permite comprar productos online y administrar catálogo y órdenes sin desplegar un servidor tradicional propio.

### Tecnologías

React 18 + TypeScript + Vite; Firebase Authentication + Firestore; AWS S3; Vercel Functions; Vitest y React Testing Library.

### Cómo funciona el carrito

Context API mantiene el estado global y useReducer centraliza acciones como agregar, eliminar, cambiar cantidades y limpiar. El reducer es una función predecible que se puede probar sin montar la aplicación completa.

### Cómo funciona el checkout

El navegador manda el carrito y el token al backend. El servidor valida el usuario, los productos, precios y stock antes de crear la orden. El pago es simulado, no se realiza un cargo real.

### Cómo funcionan los roles

Las rutas frontend separan la experiencia de cliente y administrador. Las operaciones críticas también verifican rol del lado del servidor y/o reglas de Firestore; no se confía únicamente en esconder botones.

### Cómo se manejan las imágenes

La función /api/upload valida al administrador y genera una presigned POST de cinco minutos. El navegador sube el archivo directamente a S3. Al guardar el producto, Firestore conserva la URL y la clave del objeto. Para que la URL directa se vea en el catálogo, la lectura pública debe limitarse a products/*; los adjuntos de órdenes se mantienen privados y usan URLs de descarga firmadas.

### Uso de IA

La bitácora en docs/ai-notes.md reúne consultas y decisiones de planificación, revisión de código, decisiones técnicas, generación de pruebas y resolución de problemas. Debe explicarse qué se aprendió y por qué se adoptó cada decisión, no solo afirmar que se generó código.

---

## 📝 Bitácora de IA

La bitácora completa se encuentra en [docs/ai-notes.md](docs/ai-notes.md).

Los temas documentados incluyen:

- Planificación y preparación de fixtures/wrappers de testing.
- Code review y decisiones de componentes UI.
- Resolución de problemas con IDs en formularios.
- Mejoras de componentes base y compuestos.
- Ajustes de documentación y estructura.
- Generación y validación de pruebas de seguridad Firestore.

Para la defensa, usa las entradas del documento y explica el problema original, las alternativas consideradas, qué aprendiste y cuál fue la decisión final.

---

## 👨‍💻 Autor

Nicolás/Hugo Rechimont

---

## 📄 Licencia

Proyecto académico — Proyecto Integrador 5.
