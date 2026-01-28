import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import logo from '../assets/logo.png'; // ⚠️ Pastikan file logo.png sudah ada di folder assets
import { getAPIBaseURL } from '@/lib/config';

export default function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Tembak ke Backend Localhost
            const response = await axios.post(
                `${getAPIBaseURL()}/api/v1/auth/login`,
                {
                    password: password,
                },
            );

            if (response.data.success) {
                const token = response.data.token;

                // Bersihkan token lama
                localStorage.removeItem('authToken');
                sessionStorage.removeItem('authToken');

                // Logika Remember Me
                if (rememberMe) {
                    localStorage.setItem('authToken', token);
                } else {
                    sessionStorage.setItem('authToken', token);
                }

                // Redirect ke Dashboard
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Login Gagal:', err);
            setError('Kode akses salah atau server tidak terhubung.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
            <Card className="w-full max-w-md shadow-xl border-emerald-100">
                <CardHeader className="text-center pb-2">
                    {/* LOGO AREA */}
                    <div className="mx-auto mb-4 flex items-center justify-center">
                        <img
                            src={logo}
                            alt="Logo Auto Announcer"
                            className="h-24 w-auto object-contain drop-shadow-md transition-transform hover:scale-105"
                        />
                    </div>

                    {/* JUDUL UTAMA */}
                    <CardTitle className="text-2xl font-bold text-emerald-900">
                        Auto Announcer
                    </CardTitle>

                    {/* SUB-JUDUL / BRANDING */}
                    <CardDescription className="text-emerald-700 font-medium">
                        Sistem Pengumuman Otomatis{' '}
                        <span className="font-bold">by Aslabkom</span>
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* INPUT PASSWORD */}
                        <div className="space-y-2">
                            <input
                                type="password"
                                placeholder="Masukkan Kode Akses..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-md border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-gray-700 bg-emerald-50/30 placeholder:text-gray-400"
                                required
                            />
                        </div>

                        {/* CHECKBOX REMEMBER ME */}
                        <div className="flex items-center space-x-2">
                            <input
                                id="remember"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) =>
                                    setRememberMe(e.target.checked)
                                }
                                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                            />
                            <label
                                htmlFor="remember"
                                className="text-sm text-gray-600 cursor-pointer select-none"
                            >
                                Ingat Saya (Remember Me)
                            </label>
                        </div>

                        {/* ERROR MESSAGE */}
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 text-center animate-pulse">
                                {error}
                            </div>
                        )}

                        {/* TOMBOL LOGIN */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-lg transition-all duration-200 shadow-md hover:shadow-lg mt-2"
                        >
                            {loading ? (
                                <div className="flex items-center space-x-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Memproses...</span>
                                </div>
                            ) : (
                                'Masuk Sistem'
                            )}
                        </Button>

                        <p className="text-xs text-center text-gray-400 mt-4">
                            &copy; 2026 Auto Announcer System. Haris Azhari
                            Ramadhan & Aslabkom Team.
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
