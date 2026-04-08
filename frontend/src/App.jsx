import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout';
// Import pages (we will implement these next)
import Login from './pages/Login';
import Register from './pages/Register';
import AcceptInvite from './pages/AcceptInvite';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves'; // Used for leave
import Swaps from './pages/Swaps';
import Notices from './pages/Notices';
import Availability from './pages/Availability';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/invite/:token" element={<AcceptInvite />} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="shifts" element={<Schedule />} />
        <Route path="attendance" element={<Attendance />} />
        
        {/* Manager only routes */}
        <Route path="employees" element={<ProtectedRoute allowedRoles={['manager']}><Employees /></ProtectedRoute>} />
        <Route path="notices" element={<ProtectedRoute allowedRoles={['manager']}><Notices /></ProtectedRoute>} />
        
        {/* Features applicable to both depending on contexts, but specific UI might differ */}
        <Route path="swaps" element={<Swaps />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="availability" element={<Availability />} />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <AppRoutes />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
