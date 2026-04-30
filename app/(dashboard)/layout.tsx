'use client';

import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DashboardSidebar } from '@/shared/components/shared/admin/dashboard-sidebar';
import React from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  if (status === 'loading') {
    return <div className="flex items-center justify-center h-screen">Загрузка...</div>;
  }

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'COURIER')) {
    return redirect('/admin/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" width={30} height={30} />
          <span className="font-bold">Админка</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <DashboardSidebar 
        className={cn(
          'fixed inset-y-0 left-0 z-40 md:static transform transition-transform duration-300 ease-in-out md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )} 
      />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 overflow-y-auto p-4 md:p-10">{children}</main>
    </div>
  );
}

