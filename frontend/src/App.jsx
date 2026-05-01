import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import useAuthStore from './store/authStore';
import Layout from './components/layout/Layout';
import LoginPage from './components/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import IncomingRequestsPage from './pages/IncomingRequestsPage';
import MyCampaignsPage from './pages/MyCampaignsPage';
import EarningsPage from './pages/EarningsPage';
import PerformanceAnalyticsPage from './pages/PerformanceAnalyticsPage';
import LeadManagementPage from './pages/LeadManagementPage';
import SettingsPage from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { isAuthenticated } = useAuthStore();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isGoogleConfigured = googleClientId && googleClientId !== 'your_google_client_id_here';

  const content = (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/requests" element={<IncomingRequestsPage />} />
            <Route path="/campaigns" element={<MyCampaignsPage />} />
            <Route path="/earnings" element={<EarningsPage />} />
            <Route path="/analytics" element={<PerformanceAnalyticsPage />} />
            <Route path="/leads" element={<LeadManagementPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );

  return isGoogleConfigured ? (
    <GoogleOAuthProvider clientId={googleClientId}>
      {content}
    </GoogleOAuthProvider>
  ) : content;
}
