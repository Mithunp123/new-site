import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';

export default function AdminLayout() {
  return (
    <div className="page-wrapper">
      <AdminSidebar />
      <div className="flex flex-col min-h-screen">
        <AdminTopBar />
        <main className="page-content py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
