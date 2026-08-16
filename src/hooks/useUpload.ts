import { useState, useCallback } from 'react';
import { uploadService } from '@/services/uploadService';
import type { UploadFileResult } from '@/services/uploadService';
import type { ServiceError } from '@/types/api';
import type { AsyncStatus } from '@/types/ui';

export interface UseUploadResult {
  readonly status: AsyncStatus;
  readonly error: ServiceError | null;
  readonly result: UploadFileResult | null;
  readonly progress: number;
  readonly uploadFile: (file: File, prefix?: string) => Promise<UploadFileResult | null>;
  readonly reset: () => void;
}

export function useUpload(): UseUploadResult {
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<ServiceError | null>(null);
  const [result, setResult] = useState<UploadFileResult | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadFile = useCallback(
    async (file: File, prefix = 'products'): Promise<UploadFileResult | null> => {
      setStatus('loading');
      setError(null);
      setResult(null);
      setProgress(0);

      try {
        const uploadResult = await uploadService.uploadFile({ file, prefix });
        setResult(uploadResult);
        setStatus('success');
        setProgress(100);
        return uploadResult;
      } catch (e) {
        const serviceError: ServiceError = {
          code: 'INTERNAL_ERROR',
          message: e instanceof Error ? e.message : 'Failed to upload file',
          details: { error: e instanceof Error ? e.message : String(e) },
        };
        setError(serviceError);
        setStatus('error');
        return null;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setResult(null);
    setProgress(0);
  }, []);

  return {
    status,
    error,
    result,
    progress,
    uploadFile,
    reset,
  };
}
