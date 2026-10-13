import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageUploader } from '@/components/upload/ImageUploader';

const { mockUploadFile } = vi.hoisted(() => ({ mockUploadFile: vi.fn() }));

vi.mock('@/hooks/useUpload', () => ({
  useUpload: () => ({
    status: 'idle',
    error: null,
    progress: 0,
    uploadFile: mockUploadFile,
    reset: vi.fn(),
  }),
}));

describe('ImageUploader', () => {
  beforeEach(() => {
    mockUploadFile.mockReset();
  });

  it('uploads multiple selected images and displays their thumbnails', async () => {
    mockUploadFile.mockImplementation(async (file: File) => ({
      key: file.name,
      publicUrl: `https://images.example/${file.name}`,
    }));
    const onImagesUploaded = vi.fn();
    const { container } = render(
      <ImageUploader images={[]} onImagesUploaded={onImagesUploaded} />,
    );
    const input = container.querySelector('input[type="file"]');
    const files = [
      new File(['one'], 'one.png', { type: 'image/png' }),
      new File(['two'], 'two.png', { type: 'image/png' }),
    ];

    expect(screen.getByRole('button', { name: 'Seleccionar archivos' })).toBeInTheDocument();
    expect(input).toHaveAttribute('multiple');
    fireEvent.change(input as HTMLInputElement, { target: { files } });

    await waitFor(() => {
      expect(onImagesUploaded).toHaveBeenLastCalledWith([
        { url: 'https://images.example/one.png', key: 'one.png', alt: 'one.png' },
        { url: 'https://images.example/two.png', key: 'two.png', alt: 'two.png' },
      ]);
    });
    expect(screen.getByRole('img', { name: 'one.png' })).toHaveAttribute(
      'src',
      'https://images.example/one.png',
    );
    expect(screen.getByRole('img', { name: 'two.png' })).toHaveAttribute(
      'src',
      'https://images.example/two.png',
    );
  });
});