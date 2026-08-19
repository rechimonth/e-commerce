import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import { AdminDashboardPage } from '@/pages/admin/DashboardPage';
import { dashboardService } from '@/services/dashboardService';
import type { DashboardStats } from '@/types/admin';

vi.mock('@/services/dashboardService', () => ({
  dashboardService: {
    getStats: vi.fn(),
  },
}));

const mockStats: DashboardStats = {
  totalProducts: 150,
  totalOrders: 85,
  pendingOrders: 10,
  completedOrders: 65,
  totalRevenue: { amount: 950000, currency: 'USD' },
  orderStatusCounts: {
    pending: 10,
    processing: 5,
    completed: 65,
    cancelled: 5,
  },
  recentOrders: [],
};

function createAuthValue() {
  return {
    user: { uid: 'admin-1', email: 'admin@test.com', displayName: 'Admin', photoURL: null, role: 'admin' as const, createdAt: new Date(), lastLoginAt: new Date(), preferences: { currency: 'USD' as const, locale: 'es-MX', notifications: true } },
    roleState: 'admin' as const,
    session: { uid: 'admin-1', role: 'admin' as const, isAuthenticated: true as const },
    isLoading: false,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    refreshUserProfile: vi.fn(),
    clearError: vi.fn(),
  };
}

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard with stats', async () => {
    vi.mocked(dashboardService.getStats).mockResolvedValue(mockStats);

    render(
      <AuthContext.Provider value={createAuthValue()}>
        <MemoryRouter initialEntries={['/admin']}>
          <AdminDashboardPage />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getAllByText('10')[0]).toBeInTheDocument();
    expect(screen.getAllByText('65')[0]).toBeInTheDocument();
  });

  it('renders quick actions links', async () => {
    vi.mocked(dashboardService.getStats).mockResolvedValue(mockStats);

    render(
      <AuthContext.Provider value={createAuthValue()}>
        <MemoryRouter initialEntries={['/admin']}>
          <AdminDashboardPage />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Gestionar productos')).toBeInTheDocument();
    });
    expect(screen.getByText('Ver órdenes')).toBeInTheDocument();
  });

  it('uses default values when stats not provided', async () => {
    vi.mocked(dashboardService.getStats).mockResolvedValue({
      totalProducts: 0,
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      totalRevenue: { amount: 0, currency: 'USD' },
      orderStatusCounts: { pending: 0, processing: 0, completed: 0, cancelled: 0 },
      recentOrders: [],
    });

    render(
      <AuthContext.Provider value={createAuthValue()}>
        <MemoryRouter initialEntries={['/admin']}>
          <AdminDashboardPage />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
});
