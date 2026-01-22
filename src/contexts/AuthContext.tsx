import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { authApi } from '../lib/auth';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  last_login?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cek token manual dulu biar cepat
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch (err) {
      console.error("Auth Check Error:", err);
      // Jika error (misal token expired), anggap logout
      setUser(null);
      localStorage.removeItem('token'); 
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      setError(null);
      await authApi.login();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  // ✅ PERBAIKAN UTAMA DI SINI
  const logout = async () => {
    try {
      // 1. Langsung kosongkan state user (Biar UI langsung bereaksi)
      setUser(null);
      
      // 2. Bersihkan penyimpanan manual (Jaga-jaga jika authApi gagal)
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');

      // 3. Panggil fungsi logout dari API (untuk redirect)
      await authApi.logout();
      
    } catch (err) {
      // 4. JIKA ERROR PUN, KITA PAKSA KELUAR
      console.error("Logout force trigger:", err);
      setUser(null);
      localStorage.clear(); // Hapus semua
      window.location.href = '/login'; // Tendang paksa
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    refetch: checkAuthStatus,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};