import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import TeacherLayout from './layouts/TeacherLayout';
import ParentLayout from './layouts/ParentLayout';

// Pages
import Register from './pages/Register';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import StudentClasses from './pages/StudentClasses';
import QuizPage from './pages/QuizPage';
import SessionResult from './pages/SessionResult';

const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
};

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/', element: <Navigate to="/student" replace /> },
  
  // Student Routes
  { 
    path: '/student', 
    element: <ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <StudentDashboard /> },
      { path: 'classes', element: <StudentClasses /> }
    ]
  },
  { 
    path: '/quiz', 
    element: <ProtectedRoute role="student"><QuizPage /></ProtectedRoute> 
  },
  { 
    path: '/session-result', 
    element: <ProtectedRoute role="student"><SessionResult /></ProtectedRoute> 
  },
  
  // Teacher Routes
  {
    path: '/teacher',
    element: <ProtectedRoute role="teacher"><TeacherLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <div className="p-4">Teacher Dashboard (Coming soon)</div> },
      { path: 'classes', element: <div className="p-4">Teacher Classes (Coming soon)</div> },
      { path: 'questions', element: <div className="p-4">Question Bank (Coming soon)</div> },
      { path: 'assignments', element: <div className="p-4">Assignments (Coming soon)</div> },
    ]
  },
  
  // Parent Routes
  {
    path: '/parent',
    element: <ProtectedRoute role="parent"><ParentLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <div className="p-4">Parent Dashboard (Coming soon)</div> },
    ]
  },
  
  // Global Routes
  { path: '/unauthorized', element: <div className="p-8 text-center text-red-600">Unauthorized</div> },
  { path: '*', element: <Navigate to="/login" replace /> }
]);
