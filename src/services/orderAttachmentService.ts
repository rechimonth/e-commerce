import { getCurrentUserIdToken } from '@/infrastructure/firebase/auth';

export const orderAttachmentService = {
  async getDownloadUrl(orderId: string, key: string): Promise<string> {
    const token = await getCurrentUserIdToken();
    const params = new URLSearchParams({ orderId, key });
    const response = await fetch(`/api/order-attachment?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = (await response.json()) as {
      success?: boolean;
      error?: string;
      data?: { url?: string };
    };

    if (!response.ok || !payload.success || !payload.data?.url) {
      throw new Error(payload.error ?? 'No se pudo acceder al archivo adjunto');
    }

    return payload.data.url;
  },
};
