import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout() {
  return (
    <div className="page-wrapper">
      <Sidebar />
      <div className="flex flex-col min-h-screen bg-[#F4F6FB]">
        <TopBar />
        <main className="page-content py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
