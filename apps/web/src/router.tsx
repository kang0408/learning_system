import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import { useAuthStore } from './store/authStore';

const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/unauthorized" replace />;
  return children;
};

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/', element: <Navigate to="/student" replace /> },
  { 
    path: '/student', 
    element: <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute> 
  }
]);
