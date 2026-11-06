import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {installApiAuthInterceptor} from './lib/firebase';
import './index.css';

// Sisipkan Firebase ID token ke setiap panggilan /api/* (verifikasi & rate limit di server)
installApiAuthInterceptor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
