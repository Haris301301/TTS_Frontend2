import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refetch } = useAuth();
  
  // Gunakan ref untuk mencegah double execution di React Strict Mode
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    
    const token = searchParams.get('token');

    if (token) {
      processedRef.current = true;
      
      // 1. Simpan Token ke Local Storage
      // Simpan dengan dua nama kunci untuk jaga-jaga (konsistensi kode lama vs baru)
      localStorage.setItem('auth_token', token);
      localStorage.setItem('token', token);

      console.log("Token received & saved:", token);

      // 2. Panggil refetch dari AuthContext untuk update state user
      refetch()
        .then(() => {
          // 3. Jika berhasil load user, masuk ke Dashboard
          navigate('/', { replace: true });
        })
        .catch((err) => {
          console.error("Gagal load user:", err);
          navigate('/login');
        });

    } else {
      // Jika URL tidak ada tokennya, kembalikan ke login
      console.error("No token found in URL");
      navigate('/login');
    }
  }, [searchParams, navigate, refetch]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-emerald-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
      <p className="text-emerald-800 font-medium">Memproses Login...</p>
    </div>
  );
}