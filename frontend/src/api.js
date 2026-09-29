import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
});

api.interceptors.request.use((config) => {
    const storedUser = localStorage.getItem('infy_user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    if (user?.id) {
        config.headers['x-user'] = String(user.id);
    }
    return config;
});

export default api;