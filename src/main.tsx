import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register the service worker for PWA support (offline + installable)
registerSW({
  onNeedRefresh() {
    // New content available; could show a toast to prompt reload
    console.log('[PWA] New content available. Reload to update.');
  },
  onOfflineReady() {
    console.log('[PWA] App ready to work offline.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
