import { createClient } from '@metagptx/web-sdk';
import { getAPIBaseURL } from './config';

// Konfigurasi client dengan baseURL
// SDK akan menggunakan API base URL yang benar
export const getClient = () =>
    createClient({
        baseURL: getAPIBaseURL(),
    });

// Export client yang dikonfigurasi
export const client = createClient({
    baseURL: getAPIBaseURL(),
});
