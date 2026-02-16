import React, { useState } from 'react';
import api from '../lib/api'; // 移除了 API_BASE_URL 的单独导入，因为我们主要用 api 实例
import { useNavigate } from 'react-router-dom';
import {
  Mail, Lock, Loader2, ArrowRight,
  CheckCircle2, ShieldAlert
} from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState(null);

  // --- 1. Regular & Admin Login Logic ---
  const handleAuth = async (targetDestination) => {
    setLoading(true);
    setMessage(null);

    const formData = { email, password };

    try {
      const endpoint = isSignUp ? '/auth/register' : '/auth/login';
      console.log(`🚀 Request: ${endpoint}, Target: ${targetDestination}`);

      const response = await api.post(endpoint, formData);

      // Handle both flat and nested data structures (Backend compatibility)
      let data = response.data ? response.data : response;

      console.log("Response Data:", data);

      if (!data.token || !data.user) {
        throw new Error('Server response missing token or user data');
      }

      // Check Admin Status
      const user = data.user;
      const isAdmin = user.is_admin === true || user.is_admin === "true" || user.is_admin === 1;

      // Logic Split: Admin vs Regular User
      if (targetDestination === 'admin') {
        // --- ADMIN LOGIN ---
        if (isAdmin) {
          console.log("👮 Admin Access Granted -> /admin");
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(user));
          // Use window.location.href to force a hard reload and clear old state
          window.location.href = '/admin';
        } else {
          console.warn("⛔ Admin Access Denied");
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          throw new Error('This account does not have Administrator privileges.');
        }
      } else {
        // --- REGULAR SIGN IN (HOME) ---
        console.log("🏠 Regular Login -> /");
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(user));
        // Force reload to ensure App.jsx initializes auth state correctly
        window.location.href = '/home';
      }

    } catch (err) {
      console.error("❌ Login Failed:", err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Authentication failed'
      });
    } finally {
      setLoading(false);
    }
  };

  // --- 2. OAuth Handlers (THE CRITICAL FIX) ---
  // ✅ 核心修复：这里必须使用 window.location.href，绝对不能用 fetch/axios
  const handleGoogleLogin = () => {
    // 确保 fallback 端口是你后端运行的端口 (5002)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
    console.log("Redirecting to Google Auth:", `${apiUrl}/auth/google`);
    window.location.href = `${apiUrl}/auth/google`;
  };

  const handleMicrosoftLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
    console.log("Redirecting to Microsoft Auth:", `${apiUrl}/auth/microsoft`);
    window.location.href = `${apiUrl}/auth/microsoft`;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAuth('home');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col justify-center items-center p-6 font-sans text-slate-900">

      {/* Logo Area */}
      <div className="mb-10 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary shadow-lg shadow-primary/20">
          <ArrowRight size={40} strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Welcome Back</h1>
        <p className="text-slate-400 font-bold text-sm">Organize your physical world.</p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-sm bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50">

        {/* Toggle Sign In / Sign Up */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setMessage(null); }}
            className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition-all ${!isSignUp ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setMessage(null); }}
            className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition-all ${isSignUp ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Sign Up
          </button>
        </div>

        {/* Error/Success Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-start gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
            {message.type === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <ShieldAlert size={16} className="shrink-0 mt-0.5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Form Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 ml-1 mb-2 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type="email"
                required
                placeholder="name@example.com"
                className="w-full bg-slate-50 pl-11 pr-4 py-3.5 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 ml-1 mb-2 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-slate-50 pl-11 pr-4 py-3.5 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          {/* Button 1: Main Action (Sign In / Sign Up) */}
          <button
            type="button"
            onClick={() => handleAuth('home')}
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-extrabold text-lg shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>

          {/* Button 2: Admin Login (Only shown in Login mode) */}
          {!isSignUp && (
            <button
              type="button"
              onClick={() => handleAuth('admin')}
              disabled={loading}
              className="w-full bg-slate-800 text-slate-200 py-3 rounded-2xl font-bold text-sm shadow-lg hover:bg-slate-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Admin Login'}
            </button>
          )}

        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-4 bg-white text-slate-400 font-bold uppercase tracking-wider">Or continue with</span>
          </div>
        </div>

        {/* OAuth Buttons (Cleaned up SVGs) */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white border-2 border-slate-200 text-slate-700 py-3.5 rounded-2xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={handleMicrosoftLogin}
            className="w-full bg-white border-2 border-slate-200 text-slate-700 py-3.5 rounded-2xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 shadow-sm"
          >
            {/* Corrected Microsoft SVG ViewBox for better alignment */}
            <svg className="w-5 h-5" viewBox="0 0 23 23">
              <path fill="#f3f3f3" d="M0 0h23v23H0z" />
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H12z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
            Continue with Microsoft
          </button>
        </div>

      </div>

      <p className="mt-8 text-center text-xs font-bold text-slate-300">
        By continuing, you agree to our <a href="#" className="underline hover:text-slate-400">Terms</a> & <a href="#" className="underline hover:text-slate-400">Policy</a>.
      </p>

    </div>
  );
}