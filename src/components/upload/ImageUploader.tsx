import { useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useUpload } from '@/hooks/useUpload';

interface ImageUploaderProps {
  readonly imageUrl: string;
  readonly onImageUploaded: (url: string, key: string) => void;
  readonly disabled?: boolean;
}

export function ImageUploader({
  imageUrl,
  onImageUploaded,
  disabled = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { status, error, progress, uploadFile, reset } = useUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile(file, 'products');
      if (result) {
        onImageUploaded(result.publicUrl, result.key);
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
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={disabled || status === 'loading'}
        className="block w-full text-sm text-neutral-500 file:mr-4 file:rounded-md file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50"
      />

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

      {status === 'success' && imageUrl && (
        <div className="space-y-2">
          <img
            src={imageUrl}
            alt="Preview"
            className="h-32 w-32 rounded-md border border-neutral-200 object-cover"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reset}
            >
              Cambiar imagen
            </Button>
          </div>
        </div>
      )}

      {status === 'error' && error && (
        <Alert variant="error" title="Error de subida" message={error.message} />
      )}
    </div>
  );
}
