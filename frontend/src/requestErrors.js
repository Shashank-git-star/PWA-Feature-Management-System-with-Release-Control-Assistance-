export function getRequestErrorMessage(error, fallback) {
    const detail = error?.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
        const messages = detail.map((item) => {
            if (typeof item === 'string') return item;
            if (!item || typeof item !== 'object') return '';
            const message = typeof item.msg === 'string' ? item.msg : '';
            const location = Array.isArray(item.loc) ? item.loc.join('.') : '';
            return [location, message].filter(Boolean).join(': ');
        }).filter(Boolean);
        return messages.length ? messages.join('; ') : fallback;
    }
    if (detail && typeof detail === 'object') {
        return typeof detail.message === 'string' ? detail.message : fallback;
    }
    return fallback;
}
