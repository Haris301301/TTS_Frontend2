import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'; 
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import AuthCallback from './pages/AuthCallback';
import Layout from './components/Layout';
import { Toaster } from '@/components/ui/toaster';

// 1. PROTECTED ROUTE (Updated untuk Remember Me)
// Tugas: Mengecek apakah ada Token? Kalau gak ada, tendang ke Login.
const ProtectedRoutes = () => {
  // Cek di LocalStorage (Permanen) ATAU SessionStorage (Sesi)
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

  if (!token) {
    // Jika token kosong di kedua tempat, berarti belum login / sesi habis
    return <Navigate to="/login" replace />;
  }

  // Jika token ada, izinkan masuk & bungkus dengan Layout
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

// 2. PUBLIC ROUTE (Updated)
// Tugas: Kalau user iseng buka /login padahal sudah login, lempar balik ke Dashboard.
const PublicRoutes = () => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

  if (token) {
    // Jika token masih ada, jangan kasih masuk halaman login lagi
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Route Public (Login) */}
      <Route element={<PublicRoutes />}>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Route>

      {/* Route Protected (Dashboard, dll) */}
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Catch All: Redirect ke Home (nanti dihandle ProtectedRoutes) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    // AuthProvider tetap ada untuk kebutuhan data user di dalam komponen lain
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster />
      </Router>
    </AuthProvider>
  );
}