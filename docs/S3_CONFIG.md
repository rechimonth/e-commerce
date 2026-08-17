# AWS S3 — configuración para el Proyecto 5

La aplicación utiliza una Vercel Function para generar una presigned PUT URL. Las credenciales AWS nunca se exponen al navegador.

## IAM

La credencial usada por Vercel debe tener como mínimo:

- `s3:PutObject` sobre `arn:aws:s3:::TU_BUCKET/products/*`
- `s3:GetObject` sobre `arn:aws:s3:::TU_BUCKET/products/*` si se utiliza URL estable para mostrar imágenes

No otorgar `s3:*` sobre todos los buckets.

## CORS

Configurar en el bucket una política CORS equivalente a:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://TU-PROYECTO.vercel.app"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

Reemplazar los orígenes por los reales de desarrollo y producción.

## Lectura de imágenes

El código guarda una URL estable en `Product.imageUrl`. Por lo tanto, para esta implementación académica el bucket debe permitir `GetObject` únicamente bajo `products/*`, sin utilizar `ACL: public-read`.

No habilitar acceso público a escritura.

## Upload

El flujo es:

```text
Admin browser
  ↓ Firebase ID token
POST /api/upload
  ↓ firebase-admin verifyIdToken()
  ↓ users/{uid}.role === admin
Vercel
  ↓ presigned PUT
S3 products/*
```

La presigned URL expira a los 5 minutos.
