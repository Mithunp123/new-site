import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';

export default function AdminLayout() {
  return (
    <div className="page-wrapper">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <AdminTopBar />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
