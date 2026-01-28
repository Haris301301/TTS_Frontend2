import { createClient } from '@metagptx/web-sdk';
import { getAPIBaseURL } from './config';

// Gunakan 'baseURL' dengan URL huruf kapital
export const getClient = () => createClient({
  baseURL: getAPIBaseURL() 
});