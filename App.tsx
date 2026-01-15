import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AppLayout } from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tools from './pages/Tools';
import HR from './pages/HR';
import Finance from './pages/Finance';
import Requests from './pages/Requests';
import Admin from './pages/Admin';

/**
 * 🔐 Protected Route
 * - If not logged in → redirect to /login
 * - If adminOnly and user is not Admin → redirect to /dashboard
 */
const ProtectedRoute = ({
  children,
  adminOnly
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AppLayout>
      <Routes>
        {/* 🔓 Public */}
        <Route path="/login" element={<Login />} />

        {/* 🔐 Employee + Admin */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools"
          element={
            <ProtectedRoute>
              <Tools />
            </ProtectedRoute>
          }
        />

        <Route
          path="/requests"
          element={
            <ProtectedRoute>
              <Requests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr"
          element={
            <ProtectedRoute>
              <HR />
            </ProtectedRoute>
          }
        />

        {/* 🔐 Admin ONLY */}
        <Route
          path="/finance"
          element={
            <ProtectedRoute adminOnly>
              <Finance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* 🔁 Defaults */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AppLayout>
  );
};

export default App;
