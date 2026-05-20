import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import TeacherLayout from './layouts/TeacherLayout';
import ParentLayout from './layouts/ParentLayout';

// Pages
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentClasses from './pages/student/StudentClasses';
import StudentClassDetail from './pages/student/StudentClassDetail';
import QuizPage from './pages/student/QuizPage';
import SessionResult from './pages/student/SessionResult';
// Teacher Routes
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherClassDetail from './pages/teacher/TeacherClassDetail';
import TeacherClassMembers from './pages/teacher/TeacherClassMembers';
import TeacherStudentDetail from './pages/teacher/TeacherStudentDetail';
import TeacherClassAssignments from './pages/teacher/TeacherClassAssignments';
import TeacherClassNewAssignment from './pages/teacher/TeacherClassNewAssignment';
import TeacherClassEditAssignment from './pages/teacher/TeacherClassEditAssignment';
import QuestionBank from './pages/teacher/QuestionBank';
import TeacherTopicDetail from './pages/teacher/TeacherTopicDetail';
import AssignmentWizard from './pages/teacher/AssignmentWizard';
import ParentDashboard from './pages/parent/ParentDashboard';

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
      { path: 'classes', element: <StudentClasses /> },
      { path: 'classes/:id', element: <StudentClassDetail /> }
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
      { index: true, element: <TeacherDashboard /> },
      { path: 'classes', element: <TeacherDashboard /> },
      { path: 'classes/:id', element: <TeacherClassDetail /> },
      { path: 'classes/:id/members', element: <TeacherClassMembers /> },
      { path: 'classes/:id/members/:studentId', element: <TeacherStudentDetail /> },
      { path: 'classes/:id/assignments', element: <TeacherClassAssignments /> },
      { path: 'classes/:id/assignments/new', element: <TeacherClassNewAssignment /> },
      { path: 'classes/:id/assignments/:assignmentId/edit', element: <TeacherClassEditAssignment /> },
      { path: 'questions', element: <QuestionBank /> },
      { path: 'questions/topics/:topicId', element: <TeacherTopicDetail /> },
      { path: 'assignments', element: <AssignmentWizard /> },
      { path: 'assignments/new', element: <AssignmentWizard /> },
    ]
  },
  
  // Parent Routes
  {
    path: '/parent',
    element: <ProtectedRoute role="parent"><ParentLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <ParentDashboard /> },
    ]
  },
  
  // Global Routes
  { path: '/unauthorized', element: <div className="p-8 text-center text-red-600">Unauthorized</div> },
  { path: '*', element: <Navigate to="/login" replace /> }
]);
