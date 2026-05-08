import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';
import ErrorBoundary from '../ErrorBoundary';

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <div
        className="flex flex-col bg-[#F4F6FB]"
        style={{ marginLeft: 'var(--sidebar-w, 240px)', flex: 1, minHeight: '100vh', minWidth: 0 }}
      >
        <AdminTopBar />
        <main className="page-content py-6" style={{ flex: 1 }}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
