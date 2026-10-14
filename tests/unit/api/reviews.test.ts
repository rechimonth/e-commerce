import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../../../api/reviews';

function makeResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
}

function makeRequest(method: string, headers: Record<string, string> = {}, body: unknown = {}) {
  return { method, headers, body } as unknown as VercelRequest;
}

describe('POST /api/reviews request validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects methods other than POST', async () => {
    const response = makeResponse();
    await handler(makeRequest('GET') , response as unknown as VercelResponse);
    expect(response.status).toHaveBeenCalledWith(405);
    expect(response.json).toHaveBeenCalledWith({ success: false, error: 'Método no permitido' });
  });

  it('requires a bearer token', async () => {
    const response = makeResponse();
    await handler(makeRequest('POST'), response as unknown as VercelResponse);
    expect(response.status).toHaveBeenCalledWith(401);
  });

  it('rejects invalid ratings and short comments before accessing Firebase', async () => {
    const response = makeResponse();
    await handler(
      makeRequest('POST', { authorization: 'Bearer token' }, {
        productId: 'product-1',
        rating: 6,
        comment: 'Corto',
      }),
      response as unknown as VercelResponse,
    );
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});
