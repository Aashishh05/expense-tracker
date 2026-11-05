import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: 'var(--color-surface)',
          color: 'var(--color-ink)',
          borderRadius: '14px',
          padding: '10px 16px',
          fontSize: '14px',
          boxShadow: 'var(--shadow-float)',
          maxWidth: 'calc(100vw - 32px)',
        },
      }}
    />
  </StrictMode>
);
