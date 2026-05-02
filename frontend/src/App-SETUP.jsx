// frontend/src/App.jsx - COMPLETE ROUTING SETUP

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';

// ==================== EXISTING CREATOR ROUTES ====================
// Import your existing creator pages here
// import CreatorLoginPage from './pages/CreatorLoginPage';
// import CreatorDashboardPage from './pages/CreatorDashboardPage';
// ... etc

// ==================== NEW BRAND ROUTES ====================
import BrandLoginPage from './pages/BrandLoginPage';
import BrandRegisterPage from './pages/BrandRegisterPage';
import BrandDashboardPage from './pages/BrandDashboardPage';
import BrandDiscoverPage from './pages/BrandDiscoverPage';

// ==================== NEW ADMIN ROUTES ====================
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

// ==================== PROTECTED ROUTE WRAPPER ====================
/**
 * ProtectedRoute component - ensures user is logged in
 * before allowing access to protected pages
 */
function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('gradix_token');
  const userRole = localStorage.getItem('gradix_role');

  if (!token) {
    // Redirect to appropriate login based on intended role
    if (requiredRole === 'brand') return <Navigate to="/brand/login" />;
    if (requiredRole === 'admin') return <Navigate to="/admin/login" />;
    if (requiredRole === 'creator') return <Navigate to="/login" />;
  }

  if (requiredRole && userRole !== requiredRole) {
    // User has token but wrong role - redirect to their dashboard
    if (userRole === 'brand') return <Navigate to="/brand/dashboard" />;
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" />;
    if (userRole === 'creator') return <Navigate to="/creator/dashboard" />;
  }

  return children;
}

// ==================== MAIN APP COMPONENT ====================
export default function App() {
  useEffect(() => {
    // Optional: Check token validity on app load
    const token = localStorage.getItem('gradix_token');
    if (token) {
      // Could verify token with backend here
      console.log('User session loaded');
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* ==================== HOME / LANDING ====================*/}
        <Route path="/" element={<h1>Welcome to Gradix</h1>} />

        {/* ==================== CREATOR ROUTES (EXISTING) ====================*/}
        {/* Route path="/login" element={<CreatorLoginPage />} />
        <Route path="/register" element={<CreatorRegisterPage />} />
        <Route
          path="/creator/dashboard"
          element={
            <ProtectedRoute requiredRole="creator">
              <CreatorDashboardPage />
            </ProtectedRoute>
          }
        />
        ... add more creator routes ... */}

        {/* ==================== BRAND ROUTES (NEW) ====================*/}
        {/* Brand Auth Routes - No protection needed */}
        <Route path="/brand/login" element={<BrandLoginPage />} />
        <Route path="/brand/register" element={<BrandRegisterPage />} />

        {/* Brand Protected Routes - Require brand role */}
        <Route
          path="/brand/dashboard"
          element={
            <ProtectedRoute requiredRole="brand">
              <BrandDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/brand/discover"
          element={
            <ProtectedRoute requiredRole="brand">
              <BrandDiscoverPage />
            </ProtectedRoute>
          }
        />
        {/* Additional Brand Routes - Add these as you create components */}
        {/* <Route
          path="/brand/campaigns"
          element={
            <ProtectedRoute requiredRole="brand">
              <BrandCampaignsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/brand/campaign/:id"
          element={
            <ProtectedRoute requiredRole="brand">
              <BrandCampaignDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/brand/creator/:id"
          element={
            <ProtectedRoute requiredRole="brand">
              <BrandCreatorProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/brand/payments"
          element={
            <ProtectedRoute requiredRole="brand">
              <BrandPaymentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/brand/analytics"
          element={
            <ProtectedRoute requiredRole="brand">
              <BrandAnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/brand/roi"
          element={
            <ProtectedRoute requiredRole="brand">
              <BrandRoiPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/brand/settings"
          element={
            <ProtectedRoute requiredRole="brand">
              <BrandSettingsPage />
            </ProtectedRoute>
          }
        /> */}

        {/* ==================== ADMIN ROUTES (NEW) ====================*/}
        {/* Admin Auth Route - No protection needed */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Admin Protected Routes - Require admin role */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        {/* Additional Admin Routes - Add these as you create components */}
        {/* <Route
          path="/admin/creators"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminCreatorManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/creator/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminCreatorDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/brands"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminBrandManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/brand/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminBrandDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/campaigns"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminCampaignManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/campaign/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminCampaignDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/disputes"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDisputeManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/commissions"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminCommissionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminAnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/fake-detection"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminFakeDetectionPage />
            </ProtectedRoute>
          }
        /> */}

        {/* ==================== 404 FALLBACK ====================*/}
        <Route path="*" element={<h1>Page Not Found (404)</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

/* ==================== ROUTING NOTES ====================

1. PROTECTED ROUTE PATTERN
   - All routes requiring authentication use <ProtectedRoute>
   - requiredRole param ensures role-based access control
   - Redirects to appropriate login if not authenticated

2. TOKEN STORAGE
   - gradix_token: JWT token from backend
   - gradix_role: User role (creator, brand, admin)
   - gradix_user: User data as JSON

3. ADDING NEW ROUTES
   - Create the page component
   - Import it at top of App.jsx
   - Add Route with ProtectedRoute wrapper
   - Use requiredRole prop for protected routes

4. REDIRECT LOGIC
   - /brand/login → dashboard if already logged in as brand
   - /admin/login → dashboard if already logged in as admin
   - Protected routes → appropriate login if not authenticated
   - Wrong role → user's own dashboard (auto-redirect)

5. LOGOUT BEHAVIOR
   - Use useStore.logout() to clear token
   - localStorage is automatically cleared
   - User redirected to appropriate login on next navigation

==================== */

// ==================== AXIOS INTERCEPTOR SETUP ====================
/**
 * Add this in your api/axios.js or api/config.js
 * This adds the JWT token to all requests automatically
 */

/*
import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
});

// Request interceptor - add token to headers
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('gradix_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401 unauthorized
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('gradix_token');
      localStorage.removeItem('gradix_role');
      localStorage.removeItem('gradix_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default instance;
*/

// ==================== ZUSTAND STORE SETUP ====================
/**
 * Stores handle:
 * - User authentication state
 * - Login/Logout actions
 * - Error management
 * 
 * Locations:
 * - src/store/brandStore.js (for brand users)
 * - src/store/adminStore.js (for admin users)
 * - src/store/creatorStore.js (for creator users - existing)
 */

// ==================== AVAILABLE API ENDPOINTS ====================
/**
 * Brand API (frontend/src/api/brandApi.js)
 * - brandRegister, brandLogin
 * - getBrandProfile, setBrandDetails, addBrandProduct, updateBrandLogo
 * - getBrandDashboard
 * - discoverCreators, getCreatorProfile, saveCreator, getSavedCreators
 * - sendCampaignRequest, getBrandCampaigns, getCampaignDetail
 * - approveCampaignContent, rejectCampaignContent, raiseCampaignDispute
 * - getBrandAnalytics, getBrandRoi, getBrandPayments, fundEscrow
 * 
 * Admin API (frontend/src/api/adminApi.js)
 * - adminLogin, getAdminProfile
 * - getCreators, getCreatorDetail, verifyCreator, deactivateCreator
 * - getBrands, getBrandDetail, deactivateBrand
 * - getCampaigns, getCampaignDetail, approveCampaign, markCampaignLive
 * - addCampaignAnalytics, releaseEscrow, closeCampaign
 * - getDisputes, getDisputeDetail, markDisputeUnderReview, resolveDispute
 * - getCommissions, getCommissionsSummary
 * - getPlatformAnalytics, getSuspiciousCreators
 */
