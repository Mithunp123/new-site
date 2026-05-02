import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-[#F1F5F9]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col ml-72">
        <AdminTopBar />

        <main className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-10"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
