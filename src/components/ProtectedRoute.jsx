import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    // 1. Cek Token di LocalStorage (fitur Remember Me)
    // 2. ATAU Cek Token di SessionStorage (Login biasa)
    const token =
        localStorage.getItem('auth_token') ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('auth_token') ||
        sessionStorage.getItem('token');

    // Jika token TIDAK ditemukan di kedua tempat, tendang ke halaman login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Jika token ada, izinkan akses ke halaman di dalamnya (Dashboard dll)
    return <Outlet />;
};

export default ProtectedRoute;
