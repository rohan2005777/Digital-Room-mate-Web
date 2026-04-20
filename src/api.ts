const BASE_URL = `http://${window.location.hostname}:5005/api`;

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');

    const headers = new Headers(options.headers || {});

    // Only set Content-Type if it hasn't been set by options (and isn't FormData)
    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'API Request Failed');
    }

    return data;
};
