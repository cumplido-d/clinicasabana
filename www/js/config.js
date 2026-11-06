/**
 * Configuración de Conexión Frontend -> Backend
 * Clínica de la Sabana
 *
 * NOTA IMPORTANTE:
 * Una vez que subas el backend a Railway y generes tu dominio público,
 * reemplaza BASE_URL con la URL de tu proyecto Railway, por ejemplo:
 * BASE_URL: 'https://web-production-64ac2.up.railway.app/api'
 */
const API_CONFIG = {
    // URL por defecto (Producción Railway)
    BASE_URL: (function () {
        const stored = localStorage.getItem('backend_api_url');
        const defaultUrl = 'https://web-production-64ac2.up.railway.app/api';
        if (!stored || stored.includes('clinicasabana-production')) {
            localStorage.setItem('backend_api_url', defaultUrl);
            return defaultUrl;
        }
        return stored;
    })(),

    // Helper para obtener encabezados con Token JWT
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        const token = sessionStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    // Actualizar URL del backend (ej: al conectar con Railway)
    setBaseUrl(newUrl) {
        if (!newUrl) return;
        let cleanUrl = newUrl.trim();
        if (cleanUrl.endsWith('/')) {
            cleanUrl = cleanUrl.slice(0, -1);
        }
        if (!cleanUrl.endsWith('/api')) {
            cleanUrl += '/api';
        }
        localStorage.setItem('backend_api_url', cleanUrl);
        API_CONFIG.BASE_URL = cleanUrl;
        console.log('📡 Nueva URL de Backend establecida:', cleanUrl);
    }
};