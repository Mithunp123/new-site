import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import useAuthStore from './store/authStore';

// Creator Components
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
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';

// Brand Components
import BrandRegisterPage from './pages/BrandRegisterPage';
import BrandLayout from './components/layout/BrandLayout';
import BrandDashboard from './pages/brand/Dashboard';
import BrandDiscover from './pages/brand/Discover';
import CollaborationRequests from './pages/brand/CollaborationRequests';
import SendRequest from './pages/brand/SendRequest';
import CampaignTracking from './pages/brand/CampaignTracking';
import RoiAnalytics from './pages/brand/RoiAnalytics';
import LeadManagement from './pages/brand/LeadManagement';
import BrandSettings from './pages/brand/Settings';
import BrandChatPage from './pages/brand/ChatPage';
import ErrorBoundary from './components/ErrorBoundary';

// Admin Components
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminCreatorManagementPage from './pages/AdminCreatorManagementPage';
import AdminBrandManagementPage from './pages/AdminBrandManagementPage';
import AdminCampaignManagementPage from './pages/AdminCampaignManagementPage';
import AdminDisputeManagementPage from './pages/AdminDisputeManagementPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminFakeDetectionPage from './pages/AdminFakeDetectionPage';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Protected Route for Creator
function CreatorProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'creator') return children;
  return <Navigate to="/login" replace />;
}

// Protected Route for Brand
function BrandProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'brand') return children;
  return <Navigate to="/login" replace />;
}

// Protected Route for Admin
function AdminProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'moderator';
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin) return children;
  return <Navigate to="/login" replace />;
}

export default function App() {
  const { isAuthenticated, user } = useAuthStore();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isGoogleConfigured = googleClientId && googleClientId !== 'your_google_client_id_here';

  const content = (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Landing Page - Public */}
          <Route path="/" element={<LandingPage />} />

          {/* SHARED LOGIN ROUTE */}
          <Route path="/login" element={
            isAuthenticated 
              ? (
                (user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'moderator') ? <Navigate to="/admin/dashboard" replace /> : 
                user?.role === 'brand' ? <Navigate to="/brand/dashboard" replace /> : 
                user?.role === 'creator' ? <Navigate to="/dashboard" replace /> :
                <LoginPage />
              ) 
              : <LoginPage />
          } />
          
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

          {/* CREATOR ROUTES */}
          <Route element={<CreatorProtectedRoute><Layout /></CreatorProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/requests" element={<IncomingRequestsPage />} />
            <Route path="/campaigns" element={<MyCampaignsPage />} />
            <Route path="/earnings" element={<EarningsPage />} />
            <Route path="/analytics" element={<PerformanceAnalyticsPage />} />
            <Route path="/leads" element={<LeadManagementPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/chat" element={<ChatPage />} />
          </Route>

          {/* BRAND ROUTES */}
          <Route path="/brand/register" element={isAuthenticated ? <Navigate to="/brand/dashboard" replace /> : <BrandRegisterPage />} />

          <Route element={<BrandProtectedRoute><BrandLayout /></BrandProtectedRoute>}>
            <Route path="/brand/dashboard" element={<ErrorBoundary><BrandDashboard /></ErrorBoundary>} />
            <Route path="/brand/discover" element={<ErrorBoundary><BrandDiscover /></ErrorBoundary>} />
            <Route path="/brand/requests" element={<ErrorBoundary><CollaborationRequests /></ErrorBoundary>} />
            <Route path="/brand/send-request" element={<ErrorBoundary><SendRequest /></ErrorBoundary>} />
            <Route path="/brand/campaign-tracking" element={<ErrorBoundary><CampaignTracking /></ErrorBoundary>} />
            <Route path="/brand/roi-analytics" element={<ErrorBoundary><RoiAnalytics /></ErrorBoundary>} />
            <Route path="/brand/lead-management" element={<ErrorBoundary><LeadManagement /></ErrorBoundary>} />
            <Route path="/brand/settings" element={<ErrorBoundary><BrandSettings /></ErrorBoundary>} />
            <Route path="/brand/chat" element={<ErrorBoundary><BrandChatPage /></ErrorBoundary>} />
          </Route>

          {/* ADMIN ROUTES */}
          <Route element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/creators" element={<AdminCreatorManagementPage />} />
            <Route path="/admin/verify-creators" element={<AdminCreatorManagementPage />} />
            <Route path="/admin/brands" element={<AdminBrandManagementPage />} />
            <Route path="/admin/campaigns" element={<AdminCampaignManagementPage />} />
            <Route path="/admin/disputes" element={<AdminDisputeManagementPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="/admin/fake-detection" element={<AdminFakeDetectionPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to={
            !isAuthenticated ? "/login" : 
            (user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'moderator') ? "/admin/dashboard" : 
            user?.role === 'brand' ? "/brand/dashboard" : 
            "/dashboard"
          } replace />} />
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
