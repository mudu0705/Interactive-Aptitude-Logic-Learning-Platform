import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { setAuth } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Fill in all fields');
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        toast.success(`Welcome back, ${res.data.user.name}!`);
        // Map user profile properties
        setAuth({
          id: res.data.user.id,
          email: res.data.user.email,
          name: res.data.user.name,
          role: res.data.user.role,
          xp: res.data.user.profile.xp,
          coins: res.data.user.profile.coins,
          level: res.data.user.profile.level,
          streak: res.data.user.profile.streak,
          dailyGoalXP: res.data.user.profile.dailyGoalXP,
          college: res.data.user.profile.college || undefined,
          targetCompanies: res.data.user.profile.targetCompanies || [],
          readinessScore: res.data.user.profile.readinessScore || 0,
        }, res.data.accessToken, res.data.refreshToken);
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        const devOtp = err.response?.data?.otp;
        const otpText = devOtp ? ` (Dev Mode OTP: ${devOtp})` : '';
        toast.error(`Account unverified. Redirecting to OTP verification...${otpText}`);
        navigate('/otp-verification', { state: { email, otp: devOtp } });
      } else {
        toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A13] flex items-center justify-center p-4 relative stars-bg">
      <div className="absolute top-1/3 left-1/3 w-[250px] h-[250px] bg-brand-primary/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-md p-8 rounded-2xl glass-panel relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="text-3xl font-extrabold text-gradient">AptitudeAI</Link>
          <p className="text-sm text-gray-400">Login to access your adaptive learning dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-400">Password</label>
              <span className="text-[10px] text-brand-primary hover:underline cursor-pointer">Forgot password?</span>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-brand-primary/25 transition-all text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <LogIn size={16} /> Login
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-gray-500">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-primary font-semibold hover:underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
};
