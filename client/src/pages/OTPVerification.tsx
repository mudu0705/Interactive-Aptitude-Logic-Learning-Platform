import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ShieldCheck, Mail } from 'lucide-react';

export const OTPVerification: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState(location.state?.email || '');
  const [otp, setOtp] = React.useState(location.state?.otp || '');
  const [loading, setLoading] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [resending, setResending] = React.useState(false);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) {
      return toast.error('Fill in all fields');
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      if (res.data.success) {
        toast.success(res.data.message);
        navigate('/login');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      return toast.error('Please enter your email address first');
    }
    setResending(true);
    try {
      const res = await api.post('/auth/resend-otp', { email });
      if (res.data.success) {
        const otpText = res.data.otp ? ` (Dev Mode OTP: ${res.data.otp})` : '';
        toast.success(`A new verification OTP code has been sent to your email.${otpText}`);
        if (res.data.otp) {
          setOtp(res.data.otp);
        }
        setResendCooldown(60);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A13] flex items-center justify-center p-4 relative stars-bg">
      <div className="w-full max-w-md p-8 rounded-2xl glass-panel relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <ShieldCheck size={48} className="mx-auto text-brand-primary" />
          <h2 className="text-2xl font-bold">Email Verification</h2>
          <p className="text-xs text-gray-400">
            A 6-digit OTP code has been sent to your registered email address. Enter details below to verify.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
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
            <label className="text-xs font-semibold text-gray-400">6-Digit Verification Code</label>
            <input
              type="text"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="w-full text-center tracking-[0.5em] font-extrabold text-lg py-3 rounded-xl glass-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-brand-primary/25 transition-all text-sm flex items-center justify-center"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Verify Account'
            )}
          </button>
        </form>

        <div className="text-center text-xs text-gray-400">
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resending}
            className="text-brand-primary font-semibold hover:underline disabled:opacity-50 disabled:no-underline transition-all"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
          </button>
        </div>
      </div>
    </div>
  );
};
