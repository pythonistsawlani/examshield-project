import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login          from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ExamPage       from './pages/ExamPage';
import ResultPage     from './pages/ResultPage';
import Leaderboard    from './pages/Leaderboard';
import AdminStudents    from './pages/AdminStudents';
import AdminQuestions from './pages/AdminQuestions';
import AdminResults   from './pages/AdminResults';
import Settings       from './pages/Settings';
import './styles/neon.css';

/*
  APP.JSX — Main router with protected routes
  - Public: /login
  - Student: /dashboard, /exam/:id, /result/:id, /results, /leaderboard
  - Admin: /admin, /admin/exams, /admin/students, /admin/results
*/

// Protected route — redirects to login if not authenticated
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#0e0e0e'}}>
        <p style={{fontFamily:'JetBrains Mono, monospace', color:'#00FF41', fontSize:'14px', letterSpacing:'0.15em'}}>
          AUTHENTICATING<span style={{animation:'blink 1s infinite'}}>...</span>
        </p>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public — Login page */}
      <Route
        path="/"
        element={
          user
            ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
            : <Login />
        }
      />
      <Route path="/reset-password/:token" element={user ? <Navigate to="/" replace /> : <Login />} />

      {/* Student Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>
      }/>
      <Route path="/exam/:examId" element={
        <ProtectedRoute requiredRole="student"><ExamPage /></ProtectedRoute>
      }/>
      <Route path="/result/:resultId" element={
        <ProtectedRoute><ResultPage /></ProtectedRoute>
      }/>
      <Route path="/results" element={
        <ProtectedRoute><ResultPage /></ProtectedRoute>
      }/>
      <Route path="/leaderboard" element={
        <ProtectedRoute><Leaderboard /></ProtectedRoute>
      }/>

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
      }/>
      <Route path="/admin/students" element={
        <ProtectedRoute requiredRole="admin"><AdminStudents /></ProtectedRoute>
      }/>
      <Route path="/admin/results" element={
        <ProtectedRoute requiredRole="admin"><AdminResults /></ProtectedRoute>
      }/>
      <Route path="/admin/exams" element={
        <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
      }/>
      <Route path="/admin/exam/:examId/questions" element={
        <ProtectedRoute requiredRole="admin"><AdminQuestions /></ProtectedRoute>
      }/>

      {/* Shared/Settings */}
      <Route path="/settings" element={
        <ProtectedRoute><Settings /></ProtectedRoute>
      }/>
      <Route path="/admin/settings" element={
        <ProtectedRoute requiredRole="admin"><Settings /></ProtectedRoute>
      }/>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: '#0e0e0e',
              color: '#00FF41',
              border: '1px solid #00FF41',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px'
            },
            success: { iconTheme: { primary: '#00FF41', secondary: '#000' } },
            error: { 
              style: { borderColor: '#FF006E', color: '#FF006E' },
              iconTheme: { primary: '#FF006E', secondary: '#000' }
            }
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

// Trigger Webpack HMR
