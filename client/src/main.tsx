import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { useStore } from './store/useStore';
import api from './services/api';
import { Layout } from './components/Layout';
import './index.css';

// Pages lazy loading or direct imports (Direct imports for final year project compilation speed)
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { OTPVerification } from './pages/OTPVerification';
import { Dashboard } from './pages/Dashboard';
import { Categories } from './pages/Categories';
import { TopicDetail } from './pages/TopicDetail';
import { PracticeArena } from './pages/PracticeArena';
import { AITutor } from './pages/AITutor';
import { Roadmap } from './pages/Roadmap';
import { ATSChecker } from './pages/ATSChecker';
import { MockInterview } from './pages/MockInterview';
import { DiscussionForum } from './pages/DiscussionForum';
import { VerifyCertificate } from './pages/VerifyCertificate';
import { AdminDashboard } from './pages/AdminDashboard';
import { WeeklyExamDashboard } from './pages/WeeklyExamDashboard';
import { WeeklyExamScreen } from './pages/WeeklyExamScreen';

const queryClient = new QueryClient();

// Route wrapper checking authentication status
const PrivateRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { isAuthenticated, user } = useStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Route wrapper redirecting authenticated users away from auth forms
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useStore();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

const App: React.FC = () => {
  const { setAuth, logout } = useStore();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await api.get('/auth/profile');
          if (res.data.success) {
            setAuth(res.data.profile.user, token);
            // Re-map profile properties correctly
            setAuth({
              id: res.data.profile.userId,
              email: res.data.profile.user.email,
              name: res.data.profile.user.name,
              role: res.data.profile.user.role,
              xp: res.data.profile.xp,
              coins: res.data.profile.coins,
              level: res.data.profile.level,
              streak: res.data.profile.streak,
              dailyGoalXP: res.data.profile.dailyGoalXP,
              college: res.data.profile.college || undefined,
              targetCompanies: res.data.profile.targetCompanies || [],
              readinessScore: res.data.profile.readinessScore || 0,
            }, token);
          }
        } catch (err) {
          console.error('Failed to restore auth session:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [setAuth, logout]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A13] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Views */}
          <Route path="/" element={<Landing />} />
          <Route path="/verify-certificate/:id" element={<VerifyCertificate />} />

          {/* Auth Views */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/otp-verification" element={<OTPVerification />} />

          {/* Student Panel Views */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/categories" element={<PrivateRoute><Categories /></PrivateRoute>} />
          <Route path="/topics/:slug" element={<PrivateRoute><TopicDetail /></PrivateRoute>} />
          <Route path="/practice/:sessionId" element={<PrivateRoute><PracticeArena /></PrivateRoute>} />
          <Route path="/ai-tutor" element={<PrivateRoute><AITutor /></PrivateRoute>} />
          <Route path="/roadmap" element={<PrivateRoute><Roadmap /></PrivateRoute>} />
          <Route path="/ats-checker" element={<PrivateRoute><ATSChecker /></PrivateRoute>} />
          <Route path="/mock-interview" element={<PrivateRoute><MockInterview /></PrivateRoute>} />
          <Route path="/forum" element={<PrivateRoute><DiscussionForum /></PrivateRoute>} />
          <Route path="/weekly-exams" element={<PrivateRoute><WeeklyExamDashboard /></PrivateRoute>} />
          <Route path="/weekly-exams/attempt/:examId" element={<PrivateRoute><WeeklyExamScreen /></PrivateRoute>} />

          {/* Admin Views */}
          <Route path="/admin" element={<PrivateRoute requireAdmin><AdminDashboard /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#121826', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' } }} />
    </QueryClientProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
