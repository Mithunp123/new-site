import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import BrandSidebar from './BrandSidebar';
import BrandTopBar from './BrandTopBar';
import ChatPanel from '../chat/ChatPanel';

export default function BrandLayout() {
  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <BrandSidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <BrandTopBar />
        <main className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      <ChatPanel />
    </div>
  );
}
