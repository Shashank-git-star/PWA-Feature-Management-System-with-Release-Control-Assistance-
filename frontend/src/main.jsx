import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { LanguageProvider } from './i18n.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
    <LanguageProvider>
        <App />
    </LanguageProvider>
);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .catch((error) => console.error('Service worker registration failed', error));
    });
}