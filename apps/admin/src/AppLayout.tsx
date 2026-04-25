import { Outlet } from 'react-router-dom';

import Header from '@/components/layout/Header';
import { Toaster } from '@/components/ui/sonner';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[56px] md:pt-[calc(32px+56px)]">
        <Toaster />
        <div className="mx-auto max-w-screen-2xl px-4 md:px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
