# Flujo de Upload de Imágenes — AWS S3 + Vercel Serverless

## Arquitectura

Browser
  ? POST /api/upload (fileName, fileType, token)
Vercel Serverless Function
  ? valida auth + rol admin
  ? valida extensión, content type, tamaño
  ? genera key segura
  ? AWS SDK
  ? genera presigned PUT URL (5 min)
Browser
  ? PUT directo a S3
S3
  ? URL pública almacenada en Product

## Seguridad

- AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY NUNCA salen de Vercel.
- No se exponen credenciales en el bundle del cliente.
- Solo administradores autenticados pueden solicitar URLs de subida.
- El bucket almacena objetos como privados por defecto.

## Variables de entorno (Vercel)

| Variable | Descripción |
|----------|-------------|
| AWS_ACCESS_KEY_ID | Clave de acceso AWS |
| AWS_SECRET_ACCESS_KEY | Secreto AWS |
| AWS_S3_BUCKET | Nombre del bucket S3 |
| AWS_REGION | Región AWS (ej: us-east-1) |

## Endpoint

`POST /api/upload`

### Request body
- `fileName`: string
- `fileType`: string (MIME type)
- `fileSize`: number (opcional, bytes)
- `prefix`: string (opcional, default: `products`)

### Response 200
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://...",
    "key": "products/123-abc.jpg",
    "publicUrl": "https://bucket.s3.region.amazonaws.com/products/123-abc.jpg",
    "expiresIn": 300
  }
}
```

### Errores
- `400`: validación fallida (extensión, tipo, tamaño)
- `401`: token faltante o inválido
- `403`: rol no admin
- `405`: método no POST
- `500`: error AWS o configuración

## Frontend

- `src/services/uploadService.ts`: solicita presigned URL y sube el archivo.
- `src/hooks/useUpload.ts`: maneja estado, progreso y errores.
- `src/components/upload/ImageUploader.tsx`: selector de archivo, preview, progreso.

## Tests

Ver `tests/unit/api/upload.test.ts`.
