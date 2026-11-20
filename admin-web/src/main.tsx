import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ConfigErrorScreen } from './components/layout/ConfigErrorScreen';
import { apiBaseUrl } from './lib/config';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Elemen #root tidak ditemukan.');
}

createRoot(rootElement).render(<StrictMode>{apiBaseUrl === null ? <ConfigErrorScreen /> : <App />}</StrictMode>);
