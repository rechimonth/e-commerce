import { useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useUpload } from '@/hooks/useUpload';
import type { ProductImage } from '@/types/domain';

interface ImageUploaderProps {
  readonly images: readonly ProductImage[];
  readonly onImagesUploaded: (images: readonly ProductImage[]) => void;
  readonly disabled?: boolean;
}

export function ImageUploader({
  images,
  onImagesUploaded,
  disabled = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { status, error, progress, uploadFile } = useUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    try {
      const uploadedImages = [...images];
      for (const file of files) {
        const result = await uploadFile(file, 'products');
        if (!result) break;
        const image = { url: result.publicUrl, key: result.key, alt: file.name };
        uploadedImages.push(image);
        onImagesUploaded([...uploadedImages]);
      }
    } catch {
      // El hook ya captura el error
    } finally {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleFileChange}
          disabled={disabled || status === 'loading'}
          className="sr-only"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || status === 'loading'}
        >
          Seleccionar archivos
        </Button>
        {images.length > 0 && (
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1" aria-label="Imágenes del producto">
            {images.map((image) => (
              <img
                key={image.key || image.url}
                src={image.url}
                alt={image.alt}
                title={image.alt}
                className="h-12 w-12 shrink-0 rounded-md border border-neutral-200 object-cover"
              />
            ))}
          </div>
        )}
      </div>

      {status === 'loading' && (
        <div className="space-y-2">
          <div className="h-2 w-full rounded-full bg-neutral-200">
            <div
              className="h-2 rounded-full bg-primary-500 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-neutral-500">Subiendo imagen... {progress}%</p>
        </div>
      )}

      {status === 'error' && error && (
        <Alert variant="error" title="Error de subida" message={error.message} />
      )}
    </div>
  );
}
