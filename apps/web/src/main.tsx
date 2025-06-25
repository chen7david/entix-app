import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from '@/App.tsx';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ErrorBoundary } from '@/shared/components/ui/error-boundary';
import '@/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
