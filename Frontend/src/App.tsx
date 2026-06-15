import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const DonorDashboardPage = lazy(() => import('./pages/DonorDashboardPage'));
const HospitalDashboardPage = lazy(() => import('./pages/HospitalDashboardPage'));
const BloodRequestPage = lazy(() => import('./pages/BloodRequestPage'));
const CreateBloodRequestPage = lazy(() => import('./pages/CreateBloodRequestPage'));
const RequestDetailPage = lazy(() => import('./pages/RequestDetailPage'));
const NotificationPage = lazy(() => import('./pages/NotificationPage'));
const DonationHistoryPage = lazy(() => import('./pages/DonationHistoryPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminUserManagementPage = lazy(() => import('./pages/AdminUserManagementPage'));
const AdminBloodRequestsPage = lazy(() => import('./pages/AdminBloodRequestsPage'));
const AdminDonationsPage = lazy(() => import('./pages/AdminDonationsPage'));
const HospitalApprovalsPage = lazy(() => import('./pages/HospitalApprovalsPage'));

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0d0303]">
    <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
  </div>
);

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <Suspense fallback={<Spinner />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected - both roles */}
          <Route path="/profile" element={
            <ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute><Layout><NotificationPage /></Layout></ProtectedRoute>
          } />

          {/* Donor routes */}
          <Route path="/donor" element={
            <ProtectedRoute role="donor"><Layout><DonorDashboardPage /></Layout></ProtectedRoute>
          } />
          <Route path="/donor/requests" element={
            <ProtectedRoute role="donor"><Layout><BloodRequestPage /></Layout></ProtectedRoute>
          } />
          <Route path="/donor/history" element={
            <ProtectedRoute role="donor"><Layout><DonationHistoryPage /></Layout></ProtectedRoute>
          } />

          {/* Hospital routes */}
          <Route path="/hospital" element={
            <ProtectedRoute role="hospital"><Layout><HospitalDashboardPage /></Layout></ProtectedRoute>
          } />
          <Route path="/hospital/blood-request" element={
            <ProtectedRoute role="hospital"><Layout><CreateBloodRequestPage /></Layout></ProtectedRoute>
          } />
          <Route path="/hospital/request/:id" element={
            <ProtectedRoute role="hospital"><Layout><RequestDetailPage /></Layout></ProtectedRoute>
          } />
          <Route path="/hospital/history" element={
            <ProtectedRoute role="hospital"><Layout><DonationHistoryPage /></Layout></ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute role="admin"><Layout><AdminDashboardPage /></Layout></ProtectedRoute>
          } />
          <Route path="/admin/hospitals" element={
            <ProtectedRoute role="admin"><Layout><HospitalApprovalsPage /></Layout></ProtectedRoute>
          } />
          <Route path="/admin/hospitals/:tab" element={
            <ProtectedRoute role="admin"><Layout><HospitalApprovalsPage /></Layout></ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute role="admin"><Layout><AdminUserManagementPage /></Layout></ProtectedRoute>
          } />
          <Route path="/admin/requests" element={
            <ProtectedRoute role="admin"><Layout><AdminBloodRequestsPage /></Layout></ProtectedRoute>
          } />
          <Route path="/admin/donations" element={
            <ProtectedRoute role="admin"><Layout><AdminDonationsPage /></Layout></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  </BrowserRouter>
);

export default App;