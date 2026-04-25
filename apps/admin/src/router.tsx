import { createHashRouter, type RouteObject } from 'react-router-dom';

import AppLayout from '@/AppLayout';
import Dashboard from '@/pages/Dashboard';
import NotFound from '@/pages/NotFound';
import Unsubscribes from '@/pages/unsubscribes/Unsubscribes';
import BlockedPage from '@/pages/blocked/Blocked';
import ResubscribedPage from '@/pages/resubscribed/Resubscribed';
import Reasons from '@/pages/reasons/Reasons';
import Settings from '@/pages/settings/Settings';
import Appearance from '@/pages/appearance/Appearance';

const routes: RouteObject[] = [
  { index: true, element: <Dashboard /> },
  { path: 'unsubscribes', element: <Unsubscribes /> },
  { path: 'blocked', element: <BlockedPage /> },
  { path: 'resubscribed', element: <ResubscribedPage /> },
  { path: 'reasons', element: <Reasons /> },
  { path: 'settings', element: <Settings /> },
  { path: 'appearance', element: <Appearance /> },
];

export function getManagerRouter() {
  return createHashRouter([
    {
      path: '/',
      element: <AppLayout />,
      errorElement: <NotFound />,
      children: routes,
    },
  ]);
}
