import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Settings, LogOut, Menu, X } from 'lucide-react'; // ✅ Tambah Icon Menu & X
import { Button } from '@/components/ui/button';
import logo from '../assets/logo.png';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const location = useLocation();
    const [isMobileOpen, setIsMobileOpen] = useState(false); // ✅ State untuk Menu HP

    // ✅ Fungsi Logout Manual
    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('token');
        window.location.href = '/login';
    };

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: Home },
        { path: '/schedule', label: 'Jadwal', icon: Calendar },
        { path: '/settings', label: 'Pengaturan', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* ======================================= */}
            {/* 1. TOMBOL MENU HP (Hanya Muncul di HP)  */}
            {/* ======================================= */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <Button
                    size="icon"
                    variant="outline"
                    className="bg-white shadow-md border-emerald-100 text-emerald-800"
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                >
                    {isMobileOpen ? (
                        <X className="w-6 h-6" />
                    ) : (
                        <Menu className="w-6 h-6" />
                    )}
                </Button>
            </div>

            {/* ======================================= */}
            {/* 2. OVERLAY HITAM (Background Gelap saat Menu Buka di HP) */}
            {/* ======================================= */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileOpen(false)} // Klik luar untuk tutup
                />
            )}

            {/* ======================================= */}
            {/* 3. SIDEBAR (RESPONSIVE)                 */}
            {/* ======================================= */}
            <aside
                className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 md:static md:inset-auto
      `}
            >
                {/* --- HEADER SIDEBAR (LOGO DESAIN ANDA) --- */}
                <div className="px-6 pt-2 pb-6 border-b border-gray-800 flex flex-col items-center text-center">
                    {/* 1. LOGO */}
                    <img
                        src={logo}
                        alt="Logo Aslabkom"
                        // Menggunakan styling pilihan Anda (Rapat & Naik)
                        className="w-24 h-auto object-contain -mb-5 hover:scale-105 transition-transform"
                    />

                    {/* 2. JUDUL */}
                    <h1 className="text-xl font-bold leading-none text-white tracking-tight relative z-10">
                        Auto Announcer
                    </h1>
                    <p className="text-xs text-emerald-400 font-bold uppercase tracking-wide mt-1">
                        by Aslabkom
                    </p>

                    {/* 3. VERSI */}
                    <p className="text-[10px] text-gray-500 mt-1">Versi 2.0</p>
                </div>
                {/* ----------------------------------- */}

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileOpen(false)} // ✅ Tutup menu saat link diklik (di HP)
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                                    isActive
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bagian Logout */}
                <div className="p-4 border-t border-gray-800 bg-gray-900 mt-auto">
                    <Button
                        onClick={handleLogout}
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-white hover:bg-red-600/20 group transition-all cursor-pointer"
                    >
                        <LogOut className="w-5 h-5 mr-3 group-hover:translate-x-1 transition-transform" />
                        <span className="font-semibold">Logout</span>
                    </Button>
                </div>
            </aside>

            {/* ======================================= */}
            {/* 4. MAIN CONTENT (Isi Halaman)           */}
            {/* ======================================= */}
            <main className="flex-1 overflow-auto bg-white relative w-full">
                {/* Spacer khusus HP agar konten paling atas tidak tertutup tombol menu */}
                <div className="h-16 md:hidden"></div>

                <div className="p-4 md:p-8 min-h-full">{children}</div>

                <footer className="border-t border-gray-100 py-6 px-8 text-center text-sm text-gray-500 bg-gray-50">
                    © 2026 Auto Announcer System. Haris Azhari Ramadhan &
                    Aslabkom Team.
                </footer>
            </main>
        </div>
    );
}
