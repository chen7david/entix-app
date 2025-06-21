import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import { App } from './App.tsx';
import { QueryProvider } from './lib/query-provider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </QueryProvider>
  </StrictMode>,
);
