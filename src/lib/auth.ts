import axios, { AxiosInstance } from 'axios';
import { getAPIBaseURL } from './config';

class RPApi {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Interceptor untuk menyisipkan Token otomatis
        this.client.interceptors.request.use(
            (config) => {
                const token =
                    localStorage.getItem('auth_token') ||
                    localStorage.getItem('token') ||
                    sessionStorage.getItem('auth_token') ||
                    sessionStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            },
        );
    }

    private getBaseURL() {
        return getAPIBaseURL();
    }

    async getCurrentUser() {
        try {
            const response = await this.client.get(
                `${this.getBaseURL()}/api/auth/me`,
            );
            return response.data.data || response.data;
        } catch (error: any) {
            if (
                error.response?.status === 401 ||
                error.response?.status === 404
            ) {
                return null;
            }
            throw new Error(
                error.response?.data?.detail || 'Failed to get user info',
            );
        }
    }

    async login() {
        // Redirect user ke halaman login backend (yang ada input passwordnya)
        window.location.href = `${this.getBaseURL()}/api/v1/auth/login`;
    }

    // ✅ FIX: LOGOUT LANGSUNG DI CLIENT (HAPUS TIKETNYA)
    async logout() {
        // 1. Hapus semua jejak token di Local Storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');

        // 2. Paksa refresh halaman dan lempar ke login
        // Kita pakai window.location agar state React benar-benar bersih
        window.location.href = '/login';
    }
}

export const authApi = new RPApi();
