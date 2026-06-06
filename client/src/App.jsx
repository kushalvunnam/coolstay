import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Tenants from './pages/Tenants';
import Rent from './pages/Rent';
import Complaints from './pages/Complaints';
import Visitors from './pages/Visitors';
import Reports from './pages/Reports';
import Policies from './pages/Policies';

// Route Guard: Authentication check
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-violet-600 animate-spin" />
      </div>
    );
  }
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Route Guard: Admin-only check
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Endpoint */}
          <Route path="/login" element={<Login />} />

          {/* Secure Workspace Route Group */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Unified Dashboard */}
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Admin Only Panels */}
            <Route path="rooms" element={<AdminRoute><Rooms /></AdminRoute>} />
            <Route path="tenants" element={<AdminRoute><Tenants /></AdminRoute>} />
            <Route path="reports" element={<AdminRoute><Reports /></AdminRoute>} />

            {/* Role-adaptive Unified Panels */}
            <Route path="rent" element={<Rent />} />
            <Route path="complaints" element={<Complaints />} />
            <Route path="visitors" element={<Visitors />} />
            <Route path="policies" element={<Policies />} />

            {/* Default Index Route */}
            <Route index element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Catch-all Routing */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
