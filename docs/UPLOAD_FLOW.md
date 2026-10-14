# Flujo de upload de archivos — AWS S3 + Vercel Serverless

## Arquitectura

1. El navegador solicita POST /api/upload con nombre, MIME type, tamaño, prefijo y token de Firebase.
2. La función de Vercel valida el método, el token Firebase y el rol admin consultando users/{uid} en Firestore.
3. La función valida el nombre, el formato, el tamaño máximo de 5 MB y el prefijo permitido.
4. AWS SDK genera una presigned POST de corta duración (300 segundos), con restricciones de tamaño y Content-Type.
5. El navegador envía un multipart/form-data POST directamente al endpoint de S3, incluyendo todos los campos firmados y el archivo.
6. La función devuelve la key y la URL de producto. En el formulario de productos, esa URL y key se guardan en Firestore al crear o actualizar el producto.

Importante: api/upload.ts firma la subida, pero no crea ni actualiza por sí sola el documento del producto. Esa persistencia sucede en el guardado del formulario administrativo.

## Seguridad

- AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY nunca salen de Vercel ni deben llevar prefijo VITE_.
- Solo un usuario autenticado cuyo perfil de Firestore tenga role=admin puede pedir una URL de subida.
- Se permite un prefijo fijo products o orders; la key se genera en el servidor.
- Tamaño máximo: 5 MB.
- Formatos admitidos: JPEG, PNG, WebP y GIF; PDF solo para adjuntos de órdenes.
- Extensión y MIME type deben coincidir.
- Los adjuntos de órdenes deben permanecer privados y se descargan mediante api/order-attachment.ts, que comprueba la propiedad de la orden o el rol admin antes de firmar una URL GET temporal.

## Variables de entorno (Vercel y entorno local server-side)

| Variable | Descripción |
|---|---|
| AWS_ACCESS_KEY_ID | Access key IAM dedicada al backend |
| AWS_SECRET_ACCESS_KEY | Secret key IAM del backend |
| AWS_S3_BUCKET | Nombre del bucket |
| AWS_REGION | Región del bucket, por ejemplo sa-east-1 |
| FIREBASE_SERVICE_ACCOUNT_JSON | Cuenta de servicio Firebase Admin en JSON (opción preferida) |
| FIREBASE_PROJECT_ID | ID de proyecto si se usa configuración Firebase Admin separada |
| FIREBASE_CLIENT_EMAIL | Email de la cuenta de servicio si se usa configuración separada |
| FIREBASE_PRIVATE_KEY | Clave privada si se usa configuración separada |
| ALLOWED_ORIGINS | Orígenes permitidos por la API de Vercel, separados por coma |

## CORS del bucket S3

La CORS del bucket es distinta de ALLOWED_ORIGINS. Debe permitir POST desde el origen del frontend, y GET/HEAD para las imágenes que se leen directamente desde S3. Adapta los dominios a los entornos que realmente utilizas:

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

Si pruebas en un dominio Preview de Vercel, agrega ese origen exacto a la configuración CORS de S3.

## Acceso de lectura

El código guarda una URL directa de S3 para las imágenes de producto. Si se mantienen URLs directas, los objetos de products/* deben poder leerse desde el navegador. Si se configura lectura pública, limita la política a products/* y no habilites acceso público a orders/*. No desactives todas las protecciones públicas del bucket sin evaluar el alcance: usa la política mínima posible.

Los objetos bajo orders/* deben mantenerse privados y descargarse mediante el endpoint autenticado de adjuntos.

## Endpoint

POST /api/upload

### Request body

- fileName: string, obligatorio.
- fileType: MIME type, obligatorio.
- fileSize: número en bytes, obligatorio.
- prefix: products (predeterminado) u orders.
- orderId: obligatorio cuando prefix=orders.

### Response 200

~~~json
{
  "success": true,
  "data": {
    "uploadUrl": "https://...",
    "fields": {
      "key": "products/<generated-key>",
      "Content-Type": "image/jpeg"
    },
    "key": "products/<generated-key>",
    "publicUrl": "https://bucket.s3.region.amazonaws.com/products/<generated-key>",
    "expiresIn": 300
  }
}
~~~

Los valores del ejemplo son ilustrativos; los campos firmados reales los devuelve AWS SDK.

### Errores esperados

- 400: request, extensión, MIME type, tamaño o prefijo inválido.
- 401: token ausente o inválido.
- 403: el perfil autenticado no tiene rol admin.
- 405: método distinto de POST.
- 500: configuración Firebase/AWS o error al generar la política firmada.

## Frontend

- src/services/uploadService.ts: solicita la presigned POST y envía multipart/form-data a S3.
- src/hooks/useUpload.ts: mantiene el estado de carga y errores.
- src/components/upload/ImageUploader.tsx: selector, preview y presentación del estado.
- src/pages/admin/ProductFormPage.tsx: guarda URL/key en el formulario y persiste metadatos del producto mediante productsService.

## Tests

La suite de endpoint está en tests/unit/api/upload.test.ts. Los tests mockean AWS SDK y Firebase; verifican validaciones y generación de la presigned POST, pero no sustituyen una subida real al bucket. Para confirmar el entorno productivo, hay que subir una imagen pequeña con una sesión admin real y comprobar tanto el objeto en S3 como su lectura en el catálogo.
