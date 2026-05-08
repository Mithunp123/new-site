import React from 'react';
import { Outlet } from 'react-router-dom';
import BrandSidebar from './BrandSidebar';
import BrandTopBar from './BrandTopBar';

export default function BrandLayout() {
  return (
    <div className="page-wrapper brand-theme">
      <BrandSidebar />
      <div className="flex flex-col min-h-screen bg-[#F4F6FB]">
        <BrandTopBar />
        <main className="page-content py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
