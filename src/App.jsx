import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import ItemDetail from './pages/ItemDetail';

// Layout & Components
import Layout from './components/Layout';

// Pages
import Auth from './pages/Auth';
import AuthSuccess from './pages/AuthSuccess';
import Home from './pages/Home';
import Scan from './pages/Scan';
import Search from './pages/Search';
import LocationView from './pages/LocationView';
import Lending from './pages/Lending';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/Admin/UserManagement';

// 🟢 2. 定义 PayPal 配置 (放在组件外部，防止重载)
const PAYPAL_OPTIONS = {
  "client-id": "AS-6bU65ObKTP6EUhnHkLBOk2x6tjezabC969VWH2UKmDHpKwc0-WII7y80Lh2fLpvdBSZls0I7lp5Cq", // 你的真实 Client ID
  currency: "USD",
  intent: "capture",
};

// 🟢 Admin Route Protector
function RequireAdmin({ children }) {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user || user.is_admin !== true) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token');
  });

  // Auth state is now initialized lazily above to prevent redirect loops.
  // We can listen for storage events if needed, but for now this is sufficient.

  // Global Dark Mode Listener
  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme');
    const root = document.documentElement;

    if (savedTheme === 'dark') {
      root.classList.add('dark');
      document.body.style.backgroundColor = '#0f172a'; // Slate-950
      document.body.style.color = '#f8f9fa';
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#F8F9FB'; // Light Gray
      document.body.style.color = '';
    }
  }, []);

  return (
    <PayPalScriptProvider options={PAYPAL_OPTIONS}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/success" element={<AuthSuccess />} />

          {/* Protected routes */}
          {isAuthenticated ? (
            <Route path="/*" element={
              <Routes>
                {/* Admin Routes */}
                <Route path="/admin" element={
                  <RequireAdmin>
                    <AdminDashboard />
                  </RequireAdmin>
                } />
                <Route path="/admin/users" element={
                  <RequireAdmin>
                    <UserManagement />
                  </RequireAdmin>
                } />

                {/* Regular User Routes */}
                <Route path="*" element={
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/search" element={<Search />} />
                      <Route path="/scan" element={<Scan />} />
                      <Route path="/lending" element={<Lending />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/location/:id" element={<LocationView />} />
                      <Route path="/item/:id" element={<ItemDetail />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                } />
              </Routes>
            } />
          ) : (
            <Route path="*" element={<Navigate to="/auth" replace />} />
          )}
        </Routes>
      </Router>
    </PayPalScriptProvider>
  );
}