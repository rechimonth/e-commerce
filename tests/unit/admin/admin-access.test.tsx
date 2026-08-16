import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminRoute } from '@/components/auth/AdminRoute';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    roleState: 'customer',
    isLoading: false,
  })),
}));

import { useAuth } from '@/hooks/useAuth';

describe('Admin access control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks customer from admin route', () => {
    vi.mocked(useAuth).mockReturnValue({
      roleState: 'customer',
      isLoading: false,
    } as never);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminRoute><div>Admin Panel</div></AdminRoute>} />
          <Route path="/403" element={<div>Unauthorized</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
  });

  it('allows admin to access admin route', () => {
    vi.mocked(useAuth).mockReturnValue({
      roleState: 'admin',
      isLoading: false,
    } as never);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminRoute><div>Admin Panel</div></AdminRoute>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });
});
