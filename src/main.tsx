import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/tokens.css';
import './styles/learning-os.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProductAccessProvider } from '@/contexts/ProductAccessContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ProductAccessProvider>
        <App />
      </ProductAccessProvider>
    </AuthProvider>
  </StrictMode>
);

if (import.meta.env.PROD) void import('@/lib/telemetry').then(({ startWebVitalsTelemetry }) => startWebVitalsTelemetry());

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js', { scope: '/' }));
}
