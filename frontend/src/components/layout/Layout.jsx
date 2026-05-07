import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ChatPanel from '../chat/ChatPanel';

export default function Layout() {
  return (
    <div className="page-wrapper">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <TopBar title="" />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
      <ChatPanel />
    </div>
  );
}
