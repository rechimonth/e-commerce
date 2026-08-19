/**
 * UploadService — capa de servicios para upload de imágenes a S3.
 *
 * Flujo:
 * 1. Solicitar presigned URL al backend (/api/upload).
 * 2. Subir el archivo directamente a S3 con PUT.
 * 3. Devolver la URL pública para guardarla en el producto.
 */

export interface UploadFileResult {
  readonly key: string;
  readonly publicUrl: string;
}

export interface UploadFileParams {
  readonly file: File;
  readonly prefix?: string;
}

export const uploadService = {
  async uploadFile({ file, prefix = 'products' }: UploadFileParams): Promise<UploadFileResult> {
    // Validaciones locales rápidas antes de tocar la red
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      throw new Error(`File too large. Max size is ${maxSize / (1024 * 1024)} MB`);
    }

    const allowedTypes = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ]);
    if (!allowedTypes.has(file.type)) {
      throw new Error('Invalid file type. Allowed: jpeg, png, webp, gif');
    }

    const token = await getFirebaseIdToken();
    if (!token) {
      throw new Error('No authenticated user');
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        prefix,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to get upload URL');
    }

    const { uploadUrl, key, publicUrl } = result.data;

    // Subir archivo directamente a S3
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file to S3');
    }

    return { key, publicUrl };
  },
};

async function getFirebaseIdToken(): Promise<string | null> {
  // Import dinámico para evitar ciclos y asegurar que firebase está listo
  const { getAuth } = await import('firebase/auth');
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
