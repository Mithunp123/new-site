import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ChatPanel from '../chat/ChatPanel';

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-[240px]">
        <TopBar title="" />
        <main className="px-8 py-6">
          <Outlet />
        </main>
      </div>
      <ChatPanel />
    </div>
  );
}
