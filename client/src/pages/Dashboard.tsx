import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Zap, 
  Flame, 
  Coins, 
  Award, 
  TrendingUp, 
  Activity, 
  CheckCircle, 
  Briefcase, 
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { user, updateProfile } = useStore();
  const [searchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = React.useState(activeTabParam);

  const [showSetupModal, setShowSetupModal] = React.useState(false);
  const [college, setCollege] = React.useState(user?.college || '');
  const [targetCompanies, setTargetCompanies] = React.useState<string[]>(user?.targetCompanies || []);
  const [dailyGoalXP, setDailyGoalXP] = React.useState(user?.dailyGoalXP || 100);

  const [analytics, setAnalytics] = React.useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = React.useState(true);
  const [categories, setCategories] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (activeTabParam) {
      setActiveTab(activeTabParam);
    }
  }, [activeTabParam]);

  React.useEffect(() => {
    if (user && (!user.college || user.targetCompanies.length === 0)) {
      setShowSetupModal(true);
    }
  }, [user]);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [analyticRes, certCategoryRes] = await Promise.all([
          api.get('/practice/analytics'),
          api.get('/topics/categories'),
        ]);

        if (analyticRes.data.success) {
          setAnalytics(analyticRes.data.analytics);
        }
        if (certCategoryRes.data.success) {
          setCategories(certCategoryRes.data.categories);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetCompanies.length === 0) {
      return toast.error('Select at least one target company');
    }

    try {
      const res = await api.put('/auth/profile', {
        college,
        targetCompanies,
        dailyGoalXP,
      });

      if (res.data.success) {
        updateProfile({ college, targetCompanies, dailyGoalXP });
        toast.success('Onboarding complete!');
        setShowSetupModal(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update setup profile');
    }
  };

  const toggleCompany = (company: string) => {
    if (targetCompanies.includes(company)) {
      setTargetCompanies(targetCompanies.filter((c) => c !== company));
    } else {
      setTargetCompanies([...targetCompanies, company]);
    }
  };

  const companiesList = ['TCS', 'Infosys', 'Accenture', 'Capgemini', 'Wipro', 'Cognizant'];
  const dailyProgressPercent = user ? Math.round(Math.min(100, (user.xp / user.dailyGoalXP) * 100)) : 0;

  return (
    <div className="space-y-8 pb-20">
      {/* Onboarding Dialog Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-[#070A13]/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg p-8 rounded-2xl glass-panel space-y-6">
            <div className="text-center space-y-2">
              <Zap size={36} className="mx-auto text-brand-primary animate-bounce" />
              <h2 className="text-2xl font-extrabold text-white">Complete Profile Onboarding</h2>
              <p className="text-xs text-gray-400">Configure target metrics to customize your placement roadmaps</p>
            </div>

            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">College / Institution</label>
                <input
                  type="text"
                  required
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="E.g., Stanford University"
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Select Target Companies</label>
                <div className="grid grid-cols-3 gap-2">
                  {companiesList.map((company) => {
                    const selected = targetCompanies.includes(company);
                    return (
                      <button
                        type="button"
                        key={company}
                        onClick={() => toggleCompany(company)}
                        className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                          selected 
                            ? 'bg-brand-primary/20 border-brand-primary text-white' 
                            : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {company}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Daily Study Goal (XP Target)</label>
                <input
                  type="number"
                  min={50}
                  max={500}
                  required
                  value={dailyGoalXP}
                  onChange={(e) => setDailyGoalXP(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm text-center font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-brand-primary/25 transition-all text-sm"
              >
                Complete Onboarding
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header Profile Title card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Welcome back, {user?.name}!</h1>
          <p className="text-sm text-gray-400">Track and optimize your technical competency index here.</p>
        </div>

        {/* Tab selection */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 self-stretch md:self-auto">
          {['overview', 'certificates'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:flex-initial px-6 py-2 rounded-lg text-xs font-bold transition-all capitalize ${
                activeTab === tab ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Daily Goal & Rank & Readiness Index */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* XP progress */}
            <div className="p-6 rounded-2xl glass-panel flex items-center justify-between col-span-1 border-l-4 border-brand-primary">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">XP Goal Progress</h3>
                <p className="text-xs text-gray-500">Hit your {user?.dailyGoalXP} XP daily goal.</p>
                <div className="pt-1">
                  <span className="text-2xl font-black text-white">{dailyProgressPercent}%</span>
                  <span className="text-[10px] text-gray-500 block">({user?.xp} of {user?.dailyGoalXP} XP)</span>
                </div>
              </div>
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-white/5" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-brand-primary" strokeDasharray={`${dailyProgressPercent}, 100`} strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Flame size={18} className={dailyProgressPercent >= 100 ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-gray-500'} />
                </div>
              </div>
            </div>

            {/* Placement Readiness */}
            <div className="p-6 rounded-2xl glass-panel flex flex-col justify-between border-l-4 border-l-brand-accent">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Placement Readiness %</h3>
                <p className="text-[10px] text-gray-500">Algorithmic placement success compatibility</p>
              </div>
              <div className="flex items-baseline gap-2 py-1">
                <span className="text-3xl font-black text-gradient">{user?.readinessScore ? Math.round(user.readinessScore) : 0}%</span>
                <span className="text-[9px] text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded font-bold uppercase">ATS OK</span>
              </div>
              <p className="text-[10px] text-gray-500">Calculated from practice, mock, and weekly exams.</p>
            </div>

            {/* Student Rankings */}
            <div className="p-6 rounded-2xl glass-panel flex flex-col justify-between border-l-4 border-l-yellow-500">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Leaderboard Rank</h3>
                <p className="text-[10px] text-gray-500">Weekly cohort student standing</p>
              </div>
              <div className="flex items-baseline gap-2 py-1">
                <span className="text-3xl font-black text-yellow-500">#{analytics?.globalRank || 1}</span>
                <span className="text-xs text-gray-500">among active students</span>
              </div>
              <p className="text-[10px] text-gray-500">Boost accuracy parameters to increase rank.</p>
            </div>

          </div>

          {/* AI Advisor Panel */}
          {analytics?.aiRecommendations && (
            <div className="p-6 rounded-2xl glass-panel bg-brand-accent/5 border border-brand-accent/25 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-brand-accent animate-pulse" />
                <span>AI Preparation Recommendations</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analytics.aiRecommendations.map((rec: string, idx: number) => (
                  <div key={idx} className="p-4 bg-white/5 rounded-xl text-xs text-gray-300 leading-relaxed border border-white/5">
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Graphs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Trend activity */}
            <div className="p-6 rounded-2xl glass-panel lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Daily Study Time (XP Trends)</h3>
                <span className="text-xs text-brand-primary font-bold">Activity Log</span>
              </div>
              <div className="h-60 w-full">
                {analytics?.weeklyXP ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.weeklyXP}>
                      <XAxis dataKey="day" stroke="#64748B" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
                      <Bar dataKey="xp" fill="url(#chart-purple)" radius={[4, 4, 0, 0]} />
                      <defs>
                        <linearGradient id="chart-purple" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stop-color="#8B5CF6" stop-opacity={1}/>
                          <stop offset="100%" stop-color="#8B5CF6" stop-opacity={0.1}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-500">No records found. Start practicing to generate trends.</div>
                )}
              </div>
            </div>

            {/* Subject radar performance */}
            <div className="p-6 rounded-2xl glass-panel space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Subject performance %</h3>
              <div className="h-60 w-full flex items-center justify-center">
                {analytics?.subjectPerformance && analytics.subjectPerformance.some((s: any) => s.accuracy > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={analytics.subjectPerformance}>
                      <PolarGrid stroke="rgba(255,255,255,0.05)" />
                      <PolarAngleAxis dataKey="subject" stroke="#64748B" fontSize={9} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748B" fontSize={8} />
                      <Radar name="Accuracy" dataKey="accuracy" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-xs text-gray-500">No category scores yet. Solve topic questions.</div>
                )}
              </div>
            </div>

          </div>

          {/* Company readiness & Competencies */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Company compatibility */}
            <div className="p-6 rounded-2xl glass-panel lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Company-wise Compatibility</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {analytics?.companyReadiness?.map((comp: any) => (
                  <div key={comp.company} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">{comp.company}</span>
                      <span className="text-[10px] text-brand-primary font-extrabold">{comp.score}%</span>
                    </div>
                    {/* Compatibility bar */}
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-brand-primary h-full rounded-full" style={{ width: `${comp.score}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Competency highlights */}
            <div className="p-6 rounded-2xl glass-panel space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Competency checklist</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5 text-xs">
                  <CheckCircle size={15} className="text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-gray-200">Strong Topics</p>
                    <p className="text-[11px] text-gray-500">{analytics?.strongTopics?.join(', ') || 'No topics verified yet'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs">
                  <AlertCircle size={15} className="text-yellow-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-gray-200">Weak Topics</p>
                    <p className="text-[11px] text-gray-500">{analytics?.weakTopics?.join(', ') || 'None identified'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs">
                  <Sparkles size={15} className="text-brand-primary mt-0.5 shrink-0 animate-pulse" />
                  <div>
                    <p className="font-bold text-gray-200">Recommended Topics</p>
                    <p className="text-[11px] text-gray-500">{analytics?.recommendedTopics?.join(', ') || 'Practice topics'}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Weekly Exams & Mock Assessment cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Weekly Exams card summary */}
            <div className="p-6 rounded-2xl glass-panel space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Weekly Exams Performance</h3>
                <Link to="/weekly-exams" className="text-xs text-brand-primary hover:underline flex items-center gap-1">
                  All Exams <ArrowRight size={14} />
                </Link>
              </div>

              <div className="space-y-3">
                {analytics?.weeklyExamResults && analytics.weeklyExamResults.length > 0 ? (
                  analytics.weeklyExamResults.map((res: any) => (
                    <div key={res.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">{res.exam.name}</p>
                        <p className="text-[10px] text-gray-500">Submitted: {new Date(res.submittedAt).toLocaleDateString()}</p>
                      </div>
                      <span className="font-black text-brand-primary">{res.percentage}%</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-gray-500">No completed weekly exams yet. Go to Weekly Exam Portal!</div>
                )}
              </div>
            </div>

            {/* Mock Test histories */}
            <div className="p-6 rounded-2xl glass-panel space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Mock Assessment History</h3>
              <div className="space-y-3">
                {analytics?.mockTestHistory && analytics.mockTestHistory.length > 0 ? (
                  analytics.mockTestHistory.map((res: any) => (
                    <div key={res.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">{res.mockTest.title}</p>
                        <p className="text-[10px] text-gray-500">Attempted: {new Date(res.completedAt).toLocaleDateString()}</p>
                      </div>
                      <span className="font-black text-brand-accent">{res.score} / 5 Marks</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-gray-500">No mock test history found.</div>
                )}
              </div>
            </div>

          </div>
        </>
      ) : (
        /* Certificates list */
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass-panel bg-brand-primary/5 border border-brand-primary/10 flex items-start gap-4">
            <AlertCircle className="text-brand-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-white">Complete Course Paths & Claim Badges</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Unlock placement credentials verifying competency in syllabus modules. Practice syllabus topics, demonstrate over 70% accuracy, and claim your shareable SVG certificate credentials.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((cat) => (
              <div key={cat.id} className="p-6 rounded-xl glass-panel flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-brand-primary font-bold uppercase tracking-wider">Module</span>
                    <Award size={18} className="text-brand-primary" />
                  </div>
                  <h4 className="text-lg font-bold text-white">{cat.name}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{cat.description}</p>
                </div>
                
                <button
                  onClick={async () => {
                    try {
                      const res = await api.post('/certificates/claim', { categoryId: cat.id });
                      if (res.data.success) {
                        toast.success('Certificate claimed!');
                        const details = res.data.certificate;
                        const blob = new Blob([details.svgContent], { type: 'image/svg+xml' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${details.categoryName.replace(/\s+/g, '_')}_Certificate.svg`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }
                    } catch (err: any) {
                      toast.error(err.response?.data?.message || 'Complete topics in this category first!');
                    }
                  }}
                  className="w-full py-2.5 bg-white/5 hover:bg-brand-primary/10 border border-white/5 hover:border-brand-primary/20 text-xs font-bold text-gray-300 hover:text-white rounded-xl transition-all"
                >
                  Claim & Download Certificate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
