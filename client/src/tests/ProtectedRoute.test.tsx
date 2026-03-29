import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute.tsx';
import * as AuthCtx from '../contexts/AuthContext.tsx';

vi.mock('../contexts/AuthContext.tsx', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function wrap(ui: React.ReactElement, path = '/protected') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
        <Route path="/protected" element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows spinner while loading', () => {
    vi.mocked(AuthCtx.useAuth).mockReturnValue({ isAuthenticated: false, isLoading: true, user: null, token: null, login: vi.fn(), logout: vi.fn() });
    const { container } = wrap(<ProtectedRoute><div>Protected</div></ProtectedRoute>);
    expect(container.querySelector('.MuiCircularProgress-root')).toBeTruthy();
  });

  it('redirects to /login when not authenticated', () => {
    vi.mocked(AuthCtx.useAuth).mockReturnValue({ isAuthenticated: false, isLoading: false, user: null, token: null, login: vi.fn(), logout: vi.fn() });
    wrap(<ProtectedRoute><div data-testid="content">Protected</div></ProtectedRoute>);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    vi.mocked(AuthCtx.useAuth).mockReturnValue({
      isAuthenticated: true, isLoading: false,
      user: { id: 1, email: 'test@test.com', name: 'Test', role: 'agent' },
      token: 'mock-token', login: vi.fn(), logout: vi.fn(),
    });
    wrap(<ProtectedRoute><div data-testid="content">Protected</div></ProtectedRoute>);
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });
});
