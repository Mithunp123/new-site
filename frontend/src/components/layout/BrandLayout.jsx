import React from 'react';
import { Outlet } from 'react-router-dom';
import BrandSidebar from './BrandSidebar';
import BrandTopBar from './BrandTopBar';
import ChatPanel from '../chat/ChatPanel';

export default function BrandLayout() {
  return (
    <div className="page-wrapper">
      <BrandSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <BrandTopBar />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
      <ChatPanel />
    </div>
  );
}
