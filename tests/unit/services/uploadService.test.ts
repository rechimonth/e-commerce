import { beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadService } from '@/services/uploadService';

const { getIdToken } = vi.hoisted(() => ({ getIdToken: vi.fn() }));

vi.mock('firebase/auth', () => ({
  getAuth: () => ({ currentUser: { getIdToken } }),
}));

describe('uploadService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getIdToken.mockResolvedValue('test-token');
  });

  it('uploads through the signed S3 POST fields', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            uploadUrl: 'https://s3.example/upload',
            fields: { key: 'products/random.jpg', Policy: 'signed-policy', 'Content-Type': 'image/jpeg' },
            key: 'products/random.jpg',
            publicUrl: 'https://bucket.example/products/random.jpg',
          },
        }),
      })
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });

    const result = await uploadService.uploadFile({ file });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [uploadUrl, options] = fetchMock.mock.calls[1]!;
    expect(uploadUrl).toBe('https://s3.example/upload');
    expect(options).toMatchObject({ method: 'POST' });
    const formData = options?.body as FormData;
    expect(formData.get('Policy')).toBe('signed-policy');
    expect(formData.get('Content-Type')).toBe('image/jpeg');
    expect(formData.get('file')).toBe(file);
    expect(result).toEqual({ key: 'products/random.jpg', publicUrl: 'https://bucket.example/products/random.jpg' });
  });

  it('allows PDFs only for order attachments', async () => {
    const file = new File(['document'], 'receipt.pdf', { type: 'application/pdf' });
    await expect(uploadService.uploadFile({ file, prefix: 'products' })).rejects.toThrow('Invalid file type');
  });
});
