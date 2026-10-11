import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { AdminPage } from './features/admin/admin-page';
import { LoginPage } from './features/admin/login-page';
import { PickerPage } from './features/picker/picker-page';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } },
});

const router = createBrowserRouter([
  { path: '/', element: <PickerPage /> },
  { path: '/admin', element: <AdminPage /> },
  { path: '/admin/login', element: <LoginPage /> },
]);

const root = document.getElementById('root');
if (!root) {
  throw new Error('#root introuvable');
}

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
