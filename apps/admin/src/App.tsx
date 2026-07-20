import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductFormPage } from './pages/ProductFormPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { ConversationsPage } from './pages/ConversationsPage';
import { ZonesPage } from './pages/ZonesPage';
import { Container } from '@royal-spirits/ui';

const LICENSE = import.meta.env.VITE_EXCISE_LICENSE_NUMBER ?? 'L-EXCISE-00000';

function ProtectedRoutes() {
  const { admin, loading } = useAuth();
  if (loading) {
    return (
      <Container className="flex min-h-screen items-center justify-center">
        <p className="text-rs-on-surface-variant">Loading...</p>
      </Container>
    );
  }
  if (!admin) {
    return <Navigate to="/login" replace />;
  }
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/new" element={<ProductFormPage />} />
        <Route path="/products/:id" element={<ProductFormPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/conversations" element={<ConversationsPage />} />
        <Route path="/zones" element={<ZonesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-rs-surface">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
        <footer className="border-t border-rs-outline-variant py-3">
          <Container className="flex items-center justify-between text-xs text-rs-on-surface-variant">
            <span>Royal Spirits Admin</span>
            <span>Excise License: {LICENSE}</span>
          </Container>
        </footer>
      </div>
    </AuthProvider>
  );
}
