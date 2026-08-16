import { vi } from 'vitest';

export const mockS3Client = vi.fn(() => ({}));
export const mockGetSignedUrl = vi.fn();

export function setupAwsMocks() {
  vi.mock('@aws-sdk/client-s3', () => ({
    S3Client: mockS3Client,
  }));

  vi.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: mockGetSignedUrl,
  }));
}

export function clearAwsMocks() {
  mockS3Client.mockClear();
  mockGetSignedUrl.mockClear();
}
