import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentQRPage from './pages/student/StudentQRPage';
import StudentHistory from './pages/student/StudentHistory';
import DhobiDashboard from './pages/dhobi/DhobiDashboard';
import DhobiAnalytics from './pages/dhobi/DhobiAnalytics';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedRoute from './components/common/ProtectedRoute';

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
