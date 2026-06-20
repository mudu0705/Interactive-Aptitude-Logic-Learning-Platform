import React from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Briefcase,
  Layers,
  ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../store/useStore';

export const ATSChecker: React.FC = () => {
  const { user, updateProfile } = useStore();
  
  const [file, setFile] = React.useState<File | null>(null);
  const [resumeText, setResumeText] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf')) {
        setFile(droppedFile);
        setResumeText('');
      } else {
        toast.error('Only PDF resumes are supported');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResumeText('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !resumeText.trim()) {
      return toast.error('Upload a PDF file or paste resume text to analyze.');
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    if (file) {
      formData.append('resume', file);
    } else {
      formData.append('text', resumeText);
    }

    try {
      const res = await api.post('/ai/ats', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setResult(res.data.analysis);
        toast.success('ATS analysis completed successfully!');
        
        // Sync readiness score in local state store
        if (user) {
          updateProfile({ readinessScore: res.data.analysis.score });
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'ATS analysis failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Convert company object to chart array
  const getCompanyChartData = () => {
    if (!result || !result.readyForJobPrediction) return [];
    return Object.entries(result.readyForJobPrediction).map(([company, val]) => ({
      name: company,
      probability: val,
    }));
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Resume ATS Optimizer</h1>
        <p className="text-sm text-gray-400">Match your profile keywords and score job readiness instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Column */}
        <div className="col-span-1 space-y-6">
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-base font-bold text-white">Submit Profile Resume</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Drag/Drop box */}
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 hover:border-brand-primary/50 transition-colors p-8 rounded-xl text-center cursor-pointer bg-white/5 space-y-2"
              >
                <UploadCloud size={32} className="mx-auto text-gray-400" />
                <p className="text-xs font-bold text-white">Drag and drop PDF resume here</p>
                <p className="text-[10px] text-gray-500">Supports standard text-based PDF formats (Max 5MB)</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/pdf"
                  className="hidden"
                />
              </div>

              {file && (
                <div className="p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-xl flex items-center gap-2 text-xs font-semibold text-white">
                  <FileText size={16} className="text-brand-primary" />
                  <span className="truncate">{file.name}</span>
                </div>
              )}

              <div className="text-center text-xs text-gray-500 font-semibold">— OR PASTE RESUME STRING —</div>

              <textarea
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value);
                  setFile(null);
                }}
                disabled={!!file}
                placeholder="Paste full text contents of your resume here to analyze..."
                rows={5}
                className="w-full p-3 rounded-xl glass-input text-xs resize-none disabled:opacity-40"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-xl hover:shadow-lg transition-all text-xs flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'Analyze Resume Compatibility'
                )}
              </button>

            </form>
          </div>
        </div>

        {/* Results Panel */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {result ? (
            <div className="space-y-6">
              
              {/* Score breakdown circle */}
              <div className="p-6 rounded-2xl glass-panel flex flex-col sm:flex-row items-center justify-between gap-6 border-l-4 border-l-brand-primary">
                <div className="space-y-2">
                  <span className="text-[10px] text-brand-primary font-bold uppercase bg-brand-primary/10 border border-brand-primary/20 px-3 py-1 rounded-full">Analysis Report</span>
                  <h3 className="text-xl font-bold text-white">Overall ATS Score</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    This score measures layout compatibility, formatting structure, and keyword density against standard hiring indexes. Aim for &gt;75% for optimal results.
                  </p>
                </div>
                
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center bg-white/5 border border-white/5 rounded-full shadow-lg">
                  <div className="text-center">
                    <span className="text-4xl font-extrabold text-gradient">{result.score}%</span>
                    <span className="text-[10px] text-gray-500 block">Keyword Match</span>
                  </div>
                </div>
              </div>

              {/* Suggestions panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Missing Skills */}
                <div className="p-6 rounded-xl glass-panel space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-yellow-500" />
                    <span>Missing Target Keywords</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.missingSkills.length > 0 ? (
                      result.missingSkills.map((s: string) => (
                        <span key={s} className="text-xs bg-yellow-500/10 border border-yellow-500/25 px-3 py-1 rounded-full font-bold text-yellow-400">{s}</span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">None detected. Excellent work!</span>
                    )}
                  </div>
                </div>

                {/* Suggestions and structural issues */}
                <div className="p-6 rounded-xl glass-panel space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-brand-primary" />
                    <span>Formatting Suggestions</span>
                  </h4>
                  <ul className="text-xs text-gray-400 space-y-2 list-disc pl-4 leading-normal">
                    {result.formattingSuggestions.map((s: string, idx: number) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Company Match predictions using Recharts */}
              {result.readyForJobPrediction && (
                <div className="p-6 rounded-2xl glass-panel space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <TrendingUp size={16} className="text-brand-primary" />
                      <span>Company-Wise Placement Projections</span>
                    </h3>
                    <span className="text-[10px] text-gray-500">Readiness Likelihood</span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getCompanyChartData()} layout="vertical">
                        <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 100]} />
                        <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} width={80} />
                        <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
                        <Bar dataKey="probability" fill="url(#chart-blue)" radius={[0, 4, 4, 0]} />
                        <defs>
                          <linearGradient id="chart-blue" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stop-color="#3B82F6" stop-opacity={1}/>
                            <stop offset="100%" stop-color="#EC4899" stop-opacity={1}/>
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="h-full glass-panel rounded-2xl flex flex-col items-center justify-center p-12 text-center text-gray-500 space-y-3">
              <Layers size={48} className="text-gray-600 animate-pulse" />
              <h3 className="font-bold text-base text-gray-400">ATS Feedback Console</h3>
              <p className="text-xs max-w-sm leading-normal">
                Upload your engineering resume to calculate layout compatibilities, check grammatical mistakes, and predict your recruitment profile index.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
