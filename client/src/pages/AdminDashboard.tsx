import React from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Users, 
  BookOpen, 
  BrainCircuit, 
  Plus, 
  Sparkles,
  BarChart2,
  Upload,
  Shield,
  FileText,
  Download,
  Bell,
  CheckCircle,
  XCircle,
  Database
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('analytics');
  
  // Database states
  const [users, setUsers] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [topics, setTopics] = React.useState<any[]>([]);
  const [selectedTopicId, setSelectedTopicId] = React.useState('');
  const [selectedDifficulty, setSelectedDifficulty] = React.useState('EASY');
  
  // Stats states
  const [adminStats, setAdminStats] = React.useState<any>(null);
  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);
  const [adminLogs, setAdminLogs] = React.useState<any[]>([]);

  // Weekly Exams list
  const [exams, setExams] = React.useState<any[]>([]);

  // Seeding states
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [submittingQuestion, setSubmittingQuestion] = React.useState(false);
  const [importing, setImporting] = React.useState(false);

  // Forms states
  const [examForm, setExamForm] = React.useState({
    name: '',
    startDate: '',
    endDate: '',
    duration: 30,
    totalQuestions: 10,
    categories: [] as string[],
    difficulty: 'MIXED',
    companyPattern: 'TCS',
  });

  const [notificationForm, setNotificationForm] = React.useState({
    title: '',
    message: '',
    type: 'SYSTEM',
  });

  // Custom question states
  const [qText, setQText] = React.useState('');
  const [qOptA, setQOptA] = React.useState('');
  const [qOptB, setQOptB] = React.useState('');
  const [qOptC, setQOptC] = React.useState('');
  const [qOptD, setQOptD] = React.useState('');
  const [qAns, setQAns] = React.useState('');
  const [qExplain, setQExplain] = React.useState('');

  const fetchAdminData = async () => {
    try {
      const [usersRes, catRes, statsRes, logsRes, examsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/topics/categories'),
        api.get('/admin/analytics'),
        api.get('/admin/logs/audit'),
        api.get('/weekly-exams'), // gets all exams
      ]);

      if (usersRes.data.success) setUsers(usersRes.data.users);
      if (statsRes.data.success) setAdminStats(statsRes.data.analytics);
      if (logsRes.data.success) {
        setAuditLogs(logsRes.data.auditLogs);
        setAdminLogs(logsRes.data.adminLogs);
      }
      if (examsRes.data.success) {
        setExams([...examsRes.data.liveExams, ...examsRes.data.upcomingExams, ...examsRes.data.completedExams]);
      }

      if (catRes.data.success) {
        setCategories(catRes.data.categories);
        if (catRes.data.categories.length > 0) {
          fetchCategoryTopics(catRes.data.categories[0].slug);
        }
      }
    } catch (err) {
      toast.error('Failed to load administrative panel resources');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchCategoryTopics = async (slug: string) => {
    try {
      const res = await api.get(`/topics/categories/${slug}/topics`);
      if (res.data.success) {
        setTopics(res.data.topics);
        if (res.data.topics.length > 0) {
          setSelectedTopicId(res.data.topics[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load category topics:', err);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await api.put('/admin/users/role', { userId, role: newRole });
      if (res.data.success) {
        toast.success('User role updated successfully');
        fetchAdminData();
      }
    } catch (err) {
      toast.error('Failed to update user role');
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (examForm.categories.length === 0) {
      return toast.error('Select at least one category');
    }

    try {
      const formattedStartDate = new Date(examForm.startDate).toISOString();
      const formattedEndDate = new Date(examForm.endDate).toISOString();

      const res = await api.post('/admin/exams', {
        ...examForm,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        duration: Number(examForm.duration),
        totalQuestions: Number(examForm.totalQuestions),
      });

      if (res.data.success) {
        toast.success('Weekly Exam published successfully!');
        setExamForm({
          name: '',
          startDate: '',
          endDate: '',
          duration: 30,
          totalQuestions: 10,
          categories: [],
          difficulty: 'MIXED',
          companyPattern: 'TCS',
        });
        fetchAdminData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create exam');
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/notifications', notificationForm);
      if (res.data.success) {
        toast.success('Broadcast notification sent!');
        setNotificationForm({ title: '', message: '', type: 'SYSTEM' });
        fetchAdminData();
      }
    } catch (err) {
      toast.error('Failed to send notification');
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split('\n');
        if (lines.length < 2) {
          throw new Error('CSV is empty or missing headers');
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const questionsList = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Standard split handling optional quotes
          const fields = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(f => f.trim().replace(/^"|"$/g, ''));
          const qObj: any = {};
          
          headers.forEach((h, idx) => {
            qObj[h] = fields[idx];
          });

          // Check options list format mapping
          if (qObj.question && qObj.correctAnswer) {
            const options = [qObj.optionA, qObj.optionB, qObj.optionC, qObj.optionD].filter(Boolean);
            questionsList.push({
              question: qObj.question,
              options: options.length > 0 ? options : [qObj.correctAnswer, 'Incorrect 1', 'Incorrect 2', 'Incorrect 3'],
              correctAnswer: qObj.correctAnswer,
              explanation: qObj.explanation || null,
              category: qObj.category || null,
              topic: qObj.topic || null,
              difficulty: qObj.difficulty || null,
              useAIClassification: qObj.useAIClassification === 'true' || false,
            });
          }
        }

        if (questionsList.length === 0) {
          throw new Error('No valid questions parsed from file');
        }

        const res = await api.post('/admin/questions/import', { questions: questionsList });
        if (res.data.success) {
          toast.success(res.data.message);
          fetchAdminData();
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to parse CSV file');
      } finally {
        setImporting(false);
      }
    };

    reader.readAsText(file);
  };

  const handleExportCSV = (examId: string) => {
    window.open(`${api.defaults.baseURL}/admin/results/export?examId=${examId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const companiesList = ['TCS', 'Infosys', 'Accenture', 'Wipro', 'Capgemini', 'Cognizant'];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gradient">Admin Platform Controller</h1>
          <p className="text-sm text-gray-400">System management, analytics, exam generation, and security logs auditing.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap bg-white/5 p-1 rounded-xl border border-white/5 self-stretch sm:self-auto">
          {['analytics', 'exams', 'importer', 'students', 'audit'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                activeTab === tab ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}

      {activeTab === 'analytics' && adminStats && (
        <div className="space-y-8">
          {/* Metrics summary widgets */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl glass-panel space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Students</span>
              <p className="text-3xl font-black text-white">{adminStats.totalStudents}</p>
              <p className="text-[10px] text-green-500">{adminStats.activeStudents} active in last 7d</p>
            </div>
            <div className="p-5 rounded-xl glass-panel space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Questions</span>
              <p className="text-3xl font-black text-brand-primary">{adminStats.totalQuestions}</p>
              <p className="text-[10px] text-gray-500">{adminStats.totalWeeklyExams} weekly exams scheduled</p>
            </div>
            <div className="p-5 rounded-xl glass-panel space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pass Rate %</span>
              <p className="text-3xl font-black text-green-500">{adminStats.passPercentage}%</p>
              <p className="text-[10px] text-gray-500">Average score: {adminStats.avgScore}%</p>
            </div>
            <div className="p-5 rounded-xl glass-panel space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Hardest Topic</span>
              <p className="text-lg font-black text-yellow-500 truncate mt-1">{adminStats.hardestTopic}</p>
              <p className="text-[10px] text-gray-500">Lowest accuracy recorded</p>
            </div>
          </div>

          {/* Recharts graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily activity */}
            <div className="p-6 rounded-2xl glass-panel space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Daily Attempts (Active Load)</h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adminStats.dailyActivityGraph}>
                    <XAxis dataKey="day" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
                    <Bar dataKey="attempts" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Growth chart */}
            <div className="p-6 rounded-2xl glass-panel space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Monthly Student Growth</h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={adminStats.monthlyGrowthGraph}>
                    <XAxis dataKey="month" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
                    <Line type="monotone" dataKey="students" stroke="#EC4899" strokeWidth={3} dot={{ fill: '#EC4899', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'exams' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Creator Form */}
          <div className="p-6 rounded-2xl glass-panel lg:col-span-2 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus size={18} className="text-brand-primary" />
              <span>Publish Weekly Assessment</span>
            </h3>

            <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Exam Title</label>
                <input
                  type="text"
                  required
                  value={examForm.name}
                  onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                  placeholder="e.g. Quantitative Assessment Week 2"
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={examForm.startDate}
                    onChange={(e) => setExamForm({ ...examForm, startDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl glass-input text-xs text-gray-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">End Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={examForm.endDate}
                    onChange={(e) => setExamForm({ ...examForm, endDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl glass-input text-xs text-gray-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    required
                    value={examForm.duration}
                    onChange={(e) => setExamForm({ ...examForm, duration: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-center font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Questions Count</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={examForm.totalQuestions}
                    onChange={(e) => setExamForm({ ...examForm, totalQuestions: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-center font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Difficulty Grade</label>
                  <select
                    value={examForm.difficulty}
                    onChange={(e) => setExamForm({ ...examForm, difficulty: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white focus:outline-none"
                  >
                    {['MIXED', 'EASY', 'MEDIUM', 'HARD', 'EXPERT'].map((d) => (
                      <option key={d} value={d} className="bg-[#0D111E]">{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Target Company Pattern</label>
                  <select
                    value={examForm.companyPattern}
                    onChange={(e) => setExamForm({ ...examForm, companyPattern: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white focus:outline-none"
                  >
                    {companiesList.map((c) => (
                      <option key={c} value={c} className="bg-[#0D111E]">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-gray-400 block">Syllabus Categories (Pick target pools)</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const selected = examForm.categories.includes(cat.name);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => {
                          const updated = selected 
                            ? examForm.categories.filter(c => c !== cat.name)
                            : [...examForm.categories, cat.name];
                          setExamForm({ ...examForm, categories: updated });
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                          selected 
                            ? 'bg-brand-primary/25 border-brand-primary text-white' 
                            : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-xl hover:shadow-lg transition-all text-xs"
              >
                Create and Publish Weekly Exam
              </button>
            </form>
          </div>

          {/* Active Exams & Results Export Panel */}
          <div className="p-6 rounded-2xl glass-panel space-y-4 col-span-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <FileText size={16} className="text-brand-primary" />
              <span>Published Exams Archive</span>
            </h3>

            <div className="space-y-3.5 max-h-[500px] overflow-y-auto">
              {exams.map((exam) => (
                <div key={exam.id} className="p-3.5 bg-white/5 rounded-xl border border-white/5 text-xs space-y-2">
                  <div className="flex justify-between font-bold text-white">
                    <span className="truncate max-w-[150px]">{exam.name}</span>
                    <span className="text-[9px] text-brand-primary uppercase font-bold">{exam.companyPattern}</span>
                  </div>
                  <p className="text-[10px] text-gray-500">Scheduled: {new Date(exam.startDate).toLocaleDateString()} - {new Date(exam.endDate).toLocaleDateString()}</p>
                  
                  <button
                    onClick={() => handleExportCSV(exam.id)}
                    className="w-full py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-[10px] font-bold text-brand-accent transition-all flex items-center justify-center gap-1"
                  >
                    <Download size={12} /> Export Results (CSV)
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'importer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* CSV File Upload Section */}
          <div className="p-6 rounded-2xl glass-panel lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                <Upload size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Batch Question Importer</h3>
                <p className="text-[10px] text-gray-400">Bulk upload questions using spreadsheet files (.csv)</p>
              </div>
            </div>

            {/* Template warning */}
            <div className="p-4 bg-[#0D111E] rounded-xl border border-white/5 text-xs text-gray-400 space-y-2 leading-relaxed">
              <p className="font-bold text-gray-200">CSV Columns Requirements Template:</p>
              <pre className="p-2.5 bg-black/30 rounded text-[10px] font-mono overflow-x-auto text-brand-primary">
                question,optionA,optionB,optionC,optionD,correctAnswer,explanation,difficulty,useAIClassification
              </pre>
              <p className="text-[10px] text-gray-500">
                * Note: If <code className="text-gray-300">useAIClassification</code> is true, category, topic, and detailed logic explanation will be assigned using Gemini AI fallbacks!
              </p>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center bg-white/5 relative hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-4">
              <Upload size={36} className="text-gray-500 animate-bounce" />
              <div>
                <p className="text-xs font-bold text-white">Upload Question Database CSV</p>
                <p className="text-[10px] text-gray-500 mt-1">Select or drop a valid CSV format spreadsheet</p>
              </div>

              <input
                type="file"
                accept=".csv"
                disabled={importing}
                onChange={handleCSVUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />

              {importing && (
                <div className="absolute inset-0 bg-[#070A13]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-2 rounded-2xl">
                  <span className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></span>
                  <span className="text-[10px] text-gray-400 font-bold tracking-wide animate-pulse">Processing upload. Running AI classifications...</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick AI Question generation seeder */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <BrainCircuit size={16} className="text-brand-accent" />
              <span>Single AI Generation</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Target Category</label>
                <select
                  onChange={(e) => fetchCategoryTopics(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#0D111E] border border-white/10 text-white font-bold"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Select Topic</label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#0D111E] border border-white/10 text-white"
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#0D111E] border border-white/10 text-white font-bold"
                >
                  {['EASY', 'MEDIUM', 'HARD', 'EXPERT'].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={async () => {
                  setGenerating(true);
                  try {
                    const res = await api.post('/admin/questions/generate-ai', {
                      topicId: selectedTopicId,
                      difficulty: selectedDifficulty,
                    });
                    if (res.data.success) {
                      toast.success('Question seeded in database successfully!', { icon: '🤖' });
                      fetchAdminData();
                    }
                  } catch (err) {
                    toast.error('AI question seeder is offline');
                  } finally {
                    setGenerating(false);
                  }
                }}
                disabled={generating || !selectedTopicId}
                className="w-full py-3 bg-gradient-to-r from-brand-accent to-brand-primary text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
              >
                {generating ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <BrainCircuit size={14} /> Generate with AI
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* User management table list */}
          <div className="p-6 rounded-2xl glass-panel lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Student Register</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-400">
                <thead className="text-[10px] text-gray-500 uppercase border-b border-white/5">
                  <tr>
                    <th scope="col" className="py-3">Name</th>
                    <th scope="col" className="py-3">Email</th>
                    <th scope="col" className="py-3">Role</th>
                    <th scope="col" className="py-3">Metrics</th>
                    <th scope="col" className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-4 font-bold text-white">{u.name}</td>
                      <td className="py-4">{u.email}</td>
                      <td className="py-4 font-semibold text-brand-primary">{u.role}</td>
                      <td className="py-4 space-y-0.5 text-[10px]">
                        <p>Level: {u.profile?.level || 1} | XP: {u.profile?.xp || 0}</p>
                        <p className="text-gray-500">Readiness: {Math.round(u.profile?.readinessScore || 0)}%</p>
                      </td>
                      <td className="py-4 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                          className="p-1 rounded bg-white/5 border border-white/5 text-[10px] text-white focus:outline-none"
                        >
                          <option value="STUDENT" className="bg-[#0D111E]">STUDENT</option>
                          <option value="ADMIN" className="bg-[#0D111E]">ADMIN</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Broadcast alert sender */}
          <div className="p-6 rounded-2xl glass-panel space-y-4 col-span-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Bell size={16} className="text-brand-primary" />
              <span>Broadcast System Notification</span>
            </h3>

            <form onSubmit={handleSendNotification} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Subject / Title</label>
                <input
                  type="text"
                  required
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                  placeholder="e.g. Schedule Maintenance Notice"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Message Body</label>
                <textarea
                  required
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                  placeholder="Provide detailed logs or instructions..."
                  rows={4}
                  className="w-full p-3 rounded-xl glass-input text-xs resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Alert Category</label>
                <select
                  value={notificationForm.type}
                  onChange={(e) => setNotificationForm({ ...notificationForm, type: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold"
                >
                  <option value="SYSTEM" className="bg-[#0D111E]">SYSTEM ALERT</option>
                  <option value="EXAM" className="bg-[#0D111E]">EXAM NOTICE</option>
                  <option value="ANNOUNCEMENT" className="bg-[#0D111E]">ANNOUNCEMENT</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-brand-primary text-white font-bold rounded-xl hover:shadow-lg transition-all text-xs"
              >
                Send Broadcast
              </button>
            </form>
          </div>

        </div>
      )}

      {activeTab === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Security access audit logs */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Shield size={16} className="text-red-400" />
              <span>HTTP Security Access Logs</span>
            </h3>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] space-y-1 leading-relaxed text-gray-400">
                  <div className="flex justify-between items-center text-white">
                    <span className="font-bold">{log.method} {log.endpoint}</span>
                    <span className={`font-black ${log.statusCode >= 400 ? 'text-red-400' : 'text-green-500'}`}>{log.statusCode}</span>
                  </div>
                  <p>IP Address: {log.ipAddress} | User: {log.user?.email || 'Guest'}</p>
                  <p className="text-gray-500 truncate">Agent: {log.userAgent}</p>
                  <p className="text-gray-600 text-[9px]">Timestamp: {new Date(log.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Admin audit logs */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Database size={16} className="text-brand-primary" />
              <span>Administrative Mutation Log</span>
            </h3>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {adminLogs.map((log) => (
                <div key={log.id} className="p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] space-y-1 leading-relaxed text-gray-400">
                  <div className="flex justify-between items-center text-white">
                    <span className="font-bold uppercase text-brand-accent">{log.action}</span>
                    <span className="text-gray-500 text-[9px]">{new Date(log.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p>Admin: <span className="text-gray-300 font-semibold">{log.admin.name}</span> ({log.admin.email})</p>
                  <p className="text-gray-300">{log.details}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
