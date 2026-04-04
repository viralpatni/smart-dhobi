import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentQRPage from './pages/student/StudentQRPage';
import StudentHistory from './pages/student/StudentHistory';
import LostAndFoundPage from './pages/student/LostAndFoundPage';
import DhobiDashboard from './pages/dhobi/DhobiDashboard';
import DhobiAnalytics from './pages/dhobi/DhobiAnalytics';
import LostAndFoundManager from './pages/dhobi/LostAndFoundManager';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedRoute from './components/common/ProtectedRoute';

import FeedbackPage from './pages/student/FeedbackPage';
import StaffComplaintsPage from './pages/dhobi/StaffComplaintsPage';

// Paid Laundry Imports
import PaidNewOrderPage from './pages/student/PaidNewOrderPage';
import PaidOrderHistory from './pages/student/PaidOrderHistory';
import PaidDhobiLayout from './components/paidDhobi/PaidDhobiLayout';
import PaidDhobiDashboard from './pages/paidDhobi/PaidDhobiDashboard';
import PaidDhobiOrders from './pages/paidDhobi/PaidDhobiOrders';
import PaidDhobiPricing from './pages/paidDhobi/PaidDhobiPricing';
import PaidDhobiSchedules from './pages/paidDhobi/PaidDhobiSchedules';
import PaidDhobiAnalytics from './pages/paidDhobi/PaidDhobiAnalytics';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Student Routes */}
        <Route path="/student/dashboard" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/student/qr" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentQRPage />
          </ProtectedRoute>
        } />
        <Route path="/student/history" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentHistory />
          </ProtectedRoute>
        } />
        <Route path="/student/lost-and-found" element={
          <ProtectedRoute allowedRoles={['student']}>
            <LostAndFoundPage />
          </ProtectedRoute>
        } />
        <Route path="/student/feedback" element={
          <ProtectedRoute allowedRoles={['student']}>
            <FeedbackPage />
          </ProtectedRoute>
        } />
        <Route path="/student/paid-laundry/new-order" element={
          <ProtectedRoute allowedRoles={['student']}>
            <PaidNewOrderPage />
          </ProtectedRoute>
        } />
        <Route path="/student/paid-laundry/history" element={
          <ProtectedRoute allowedRoles={['student']}>
            <PaidOrderHistory />
          </ProtectedRoute>
        } />

        {/* Dhobi Staff Routes */}
        <Route path="/dhobi/dashboard" element={
          <ProtectedRoute allowedRoles={['staff']}>
            <DhobiDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dhobi/analytics" element={
          <ProtectedRoute allowedRoles={['staff']}>
            <DhobiAnalytics />
          </ProtectedRoute>
        } />
        <Route path="/dhobi/lost-and-found" element={
          <ProtectedRoute allowedRoles={['staff']}>
            <LostAndFoundManager />
          </ProtectedRoute>
        } />
        <Route path="/dhobi/complaints" element={
          <ProtectedRoute allowedRoles={['staff']}>
            <StaffComplaintsPage />
          </ProtectedRoute>
        } />

        {/* Paid Dhobi Staff Routes */}
        <Route path="/paid-dhobi" element={
          <ProtectedRoute allowedRoles={['paidStaff']}>
            <PaidDhobiLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<PaidDhobiDashboard />} />
          <Route path="orders" element={<PaidDhobiOrders />} />
          <Route path="pricing" element={<PaidDhobiPricing />} />
          <Route path="schedules" element={<PaidDhobiSchedules />} />
          <Route path="analytics" element={<PaidDhobiAnalytics />} />
          <Route path="complaints" element={<StaffComplaintsPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={
           <ProtectedRoute allowedRoles={['admin']}>
             <AdminDashboard />
           </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
