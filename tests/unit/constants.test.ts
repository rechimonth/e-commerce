import { describe, it, expect } from 'vitest';
import { ROUTES } from '@/constants/routes';

describe('Constants', () => {
  it('ROUTES should have all required paths', () => {
    expect(ROUTES.HOME).toBe('/');
    expect(ROUTES.LOGIN).toBe('/login');
    expect(ROUTES.REGISTER).toBe('/register');
    expect(ROUTES.ADMIN).toBe('/admin');
    expect(ROUTES.NOT_FOUND).toBe('/404');
  });

  it('should generate dynamic routes', () => {
    expect(ROUTES.PRODUCT_DETAIL('123')).toBe('/products/123');
    expect(ROUTES.ORDER_DETAIL('456')).toBe('/orders/456');
    expect(ROUTES.ADMIN_PRODUCT_EDIT('789')).toBe('/admin/products/789/edit');
  });
});
