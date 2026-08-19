import type { Product, CartState, UserProfile, Order } from '@/types';
import { money } from '@/types/pricing';

export const productFixture: Product = {
  id: 'prod-1',
  name: 'Test Product',
  description: 'A test product description',
  price: money(1999),
  category: 'action-figures',
  image: {
    url: 'https://example.com/img.png',
    alt: 'Test Product',
    key: 'img-1',
  },
  stock: 10,
  rating: 4.5,
  reviewCount: 100,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  createdBy: 'admin-1',
};

export const cartStateFixture: CartState = {
  items: [
    {
      productId: 'prod-1',
      name: 'Test Product',
      price: money(1999),
      quantity: 2,
      image: {
        url: 'https://example.com/img.png',
        alt: 'Test Product',
        key: 'img-1',
      },
      maxStock: 10,
    },
    {
      productId: 'prod-2',
      name: 'Another Product',
      price: money(499),
      quantity: 1,
      image: {
        url: 'https://example.com/img2.png',
        alt: 'Another Product',
        key: 'img-2',
      },
      maxStock: 5,
    },
  ],
  discount: money(0),
  totalItems: 3,
  totalPrice: money(4497),
  lastUpdated: new Date('2024-01-03'),
};

export const userCustomerFixture: UserProfile = {
  uid: 'customer-1',
  email: 'customer@test.com',
  displayName: 'Customer User',
  photoURL: null,
  role: 'customer',
  createdAt: new Date('2024-01-01'),
  lastLoginAt: new Date('2024-01-03'),
  preferences: {
    currency: 'USD',
    locale: 'es-MX',
    notifications: true,
  },
};

export const userAdminFixture: UserProfile = {
  uid: 'admin-1',
  email: 'admin@test.com',
  displayName: 'Admin User',
  photoURL: null,
  role: 'admin',
  createdAt: new Date('2024-01-01'),
  lastLoginAt: new Date('2024-01-03'),
  preferences: {
    currency: 'USD',
    locale: 'es-MX',
    notifications: true,
  },
};

export const orderFixture: Order = {
  id: 'order-1',
  userId: 'customer-1',
  items: [
    {
      orderId: 'order-1',
      productId: 'prod-1',
      name: 'Test Product',
      price: money(1999),
      quantity: 2,
      image: {
        url: 'https://example.com/img.png',
        alt: 'Test Product',
        key: 'order-1',
      },
    },
  ],
  pricing: {
    subtotal: money(3998),
    tax: money(0),
    shipping: money(0),
    discount: money(0),
    total: money(3998),
  },
  status: 'pending',
  statusHistory: [
    {
      from: 'pending',
      to: 'pending',
      by: 'customer-1',
      timestamp: new Date('2024-01-03'),
    },
  ],
  shippingAddress: {
    street: '123 Main St',
    city: 'Test City',
    state: 'Test State',
    zipCode: '12345',
    country: 'Spain',
  },
  billingAddress: {
    street: '123 Main St',
    city: 'Test City',
    state: 'Test State',
    zipCode: '12345',
    country: 'Spain',
  },
  paymentMethod: 'card',
  notes: 'Test order notes',
  createdAt: new Date('2024-01-03'),
  updatedAt: new Date('2024-01-03'),
};
