import React from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { ShieldCheck, ShieldAlert, Award, Calendar, User, CheckCircle2 } from 'lucide-react';

export const VerifyCertificate: React.FC = () => {
  const { id } = useParams();
  
  const [certId, setCertId] = React.useState(id || '');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState('');

  const verify = React.useCallback(async (targetId: string) => {
    if (!targetId.trim()) return;
    setLoading(true);
    setResult(null);
    setError('');
    
    try {
      const res = await api.get(`/certificates/verify/${targetId}`);
      if (res.data.success) {
        setResult(res.data.certificate);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Certificate verification failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (id) {
      verify(id);
    }
  }, [id, verify]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verify(certId);
  };

  return (
    <div className="min-h-screen bg-[#070A13] flex items-center justify-center p-4 relative stars-bg">
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-brand-primary/10 rounded-full blur-[90px] pointer-events-none"></div>

      <div className="w-full max-w-lg p-8 rounded-2xl glass-panel relative z-10 space-y-6">
        
        <div className="text-center space-y-2">
          <Link to="/" className="text-2xl font-extrabold text-gradient">AptitudeAI</Link>
          <h2 className="text-xl font-bold text-white">Placement Credentials Verifier</h2>
          <p className="text-xs text-gray-400">Validate authenticity of shared certificates immediately.</p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            required
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
            placeholder="Enter Unique Certificate ID (UUID)..."
            className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs font-mono"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-xs rounded-xl transition-all shrink-0"
          >
            {loading ? 'Checking...' : 'Verify'}
          </button>
        </form>

        {/* Verification Success Results panel */}
        {result && (
          <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-xl space-y-4 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 text-green-500 opacity-20">
              <CheckCircle2 size={72} />
            </div>

            <div className="flex items-center gap-2 border-b border-green-500/10 pb-3">
              <ShieldCheck className="text-green-500" />
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">Verification Complete</p>
                <p className="text-[10px] text-green-400 font-semibold font-mono">{result.certificateId}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-normal">
              <div className="flex items-center gap-2 text-gray-400">
                <User size={14} className="text-gray-500" />
                <span>Recipient: <strong className="text-white font-semibold">{result.recipientName}</strong></span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-400">
                <Award size={14} className="text-gray-500" />
                <span>Curriculum: <strong className="text-white font-semibold">{result.categoryName}</strong></span>
              </div>

              <div className="flex items-center gap-2 text-gray-400">
                <Calendar size={14} className="text-gray-500" />
                <span>Issued On: <strong className="text-white font-semibold">{new Date(result.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
              </div>
            </div>

            <div className="pt-2 border-t border-green-500/10 text-center">
              <span className="text-[10px] text-green-400 font-bold bg-green-500/10 px-3 py-1 rounded-full uppercase tracking-wider">✓ Authenticated Credential</span>
            </div>
          </div>
        )}

        {/* Failure Warning panel */}
        {error && (
          <div className="p-5 bg-red-500/5 border border-red-500/25 rounded-xl space-y-2 text-center text-xs">
            <ShieldAlert size={28} className="mx-auto text-red-500" />
            <p className="font-bold text-white uppercase tracking-wider">Invalid Certificate</p>
            <p className="text-gray-400 leading-normal">{error}</p>
          </div>
        )}

        <div className="text-center">
          <Link to="/" className="text-xs text-gray-500 hover:text-white transition-colors">← Back to Platform</Link>
        </div>

      </div>
    </div>
  );
};
