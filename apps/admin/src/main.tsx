import './main.css';

import React from 'react';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { getManagerRouter } from '@/router';
import { showToast } from '@/lib/toast';
import { ConfirmDialogProvider } from '@/components/ui/confirm-dialog';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: Error) => {
      showToast.error(__(`An error occurred: ${error.message}`));
    },
  }),
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const mountNode = document.getElementById('flexa-unsubscribe');
if (mountNode) {
  createRoot(mountNode).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ConfirmDialogProvider>
          <RouterProvider router={getManagerRouter()} />
        </ConfirmDialogProvider>
      </QueryClientProvider>
    </React.StrictMode>,
  );
}
