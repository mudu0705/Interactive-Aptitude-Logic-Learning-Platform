import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  Clock, 
  Award, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  BookOpen, 
  Zap, 
  ArrowLeft,
  Users
} from 'lucide-react';

export const WeeklyExamDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [liveExams, setLiveExams] = React.useState<any[]>([]);
  const [upcomingExams, setUpcomingExams] = React.useState<any[]>([]);
  const [completedExams, setCompletedExams] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Results inspection states
  const [selectedAttemptId, setSelectedAttemptId] = React.useState<string | null>(null);
  const [analysis, setAnalysis] = React.useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = React.useState(false);

  const fetchExams = async () => {
    try {
      const res = await api.get('/weekly-exams');
      if (res.data.success) {
        setLiveExams(res.data.liveExams);
        setUpcomingExams(res.data.upcomingExams);
        setCompletedExams(res.data.completedExams);
      }
    } catch (err) {
      toast.error('Failed to load Weekly Exams listing');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchExams();
  }, []);

  const loadAnalysis = async (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setLoadingAnalysis(true);
    try {
      const res = await api.get(`/weekly-exams/attempts/${attemptId}/result`);
      if (res.data.success) {
        setAnalysis(res.data);
      }
    } catch (err) {
      toast.error('Failed to fetch detailed exam analytics');
      setSelectedAttemptId(null);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleStartExam = (examId: string) => {
    navigate(`/weekly-exams/attempt/${examId}`);
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render Detailed Analysis View
  if (selectedAttemptId && analysis) {
    return (
      <div className="space-y-8 pb-20">
        <button
          onClick={() => {
            setSelectedAttemptId(null);
            setAnalysis(null);
            fetchExams();
          }}
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-all bg-white/5 border border-white/5 px-4 py-2 rounded-xl"
        >
          <ArrowLeft size={16} /> Back to Exams
        </button>

        <div>
          <h1 className="text-3xl font-extrabold text-white">{analysis.examName} - Review</h1>
          <p className="text-sm text-gray-400">Detailed question-by-question performance analysis and rankings.</p>
        </div>

        {/* Analytics Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-5 rounded-xl glass-panel text-center">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Score Achieved</p>
            <p className="text-2xl font-black text-white mt-1">{analysis.score} Marks</p>
          </div>
          <div className="p-5 rounded-xl glass-panel text-center">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Percentage</p>
            <p className="text-2xl font-black text-brand-primary mt-1">{analysis.percentage}%</p>
          </div>
          <div className="p-5 rounded-xl glass-panel text-center">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Rank achieved</p>
            <p className="text-2xl font-black text-yellow-500 mt-1">#{analysis.rank} <span className="text-xs text-gray-500">/ {analysis.totalParticipants}</span></p>
          </div>
          <div className="p-5 rounded-xl glass-panel text-center text-green-500">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Correct Answers</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <CheckCircle size={18} />
              <span className="text-2xl font-black">{analysis.correctAnswers}</span>
            </div>
          </div>
          <div className="p-5 rounded-xl glass-panel text-center text-red-400">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Wrong Answers</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <XCircle size={18} />
              <span className="text-2xl font-black">{analysis.wrongAnswers}</span>
            </div>
          </div>
        </div>

        {/* Questions list review */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white">Review Questions</h3>
          {analysis.questions.map((q: any, idx: number) => (
            <div key={q.id} className={`p-6 rounded-2xl glass-panel border-l-4 ${q.isCorrect ? 'border-l-green-500' : 'border-l-red-500'} space-y-4`}>
              <div className="flex justify-between items-start gap-4">
                <span className="text-xs font-bold text-gray-400">Question {idx + 1} ({q.difficulty})</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${q.isCorrect ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {q.isCorrect ? 'Correct (+1)' : 'Incorrect (0)'}
                </span>
              </div>

              <p className="text-sm font-semibold text-gray-200 leading-relaxed whitespace-pre-wrap">{q.text}</p>

              {/* Shuffled Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {q.options.map((opt: string) => {
                  const isCorrectOpt = opt === q.correctAnswer;
                  const isSelectedOpt = opt === q.selectedAnswer;
                  let borderStyle = 'border-white/5 bg-white/5 text-gray-400';
                  
                  if (isCorrectOpt) {
                    borderStyle = 'border-green-500/30 bg-green-500/10 text-green-400 font-semibold';
                  } else if (isSelectedOpt && !isCorrectOpt) {
                    borderStyle = 'border-red-500/30 bg-red-500/10 text-red-400';
                  }

                  return (
                    <div key={opt} className={`p-3.5 rounded-xl border text-xs flex justify-between items-center ${borderStyle}`}>
                      <span>{opt}</span>
                      {isCorrectOpt && <CheckCircle size={14} className="text-green-500 shrink-0" />}
                      {isSelectedOpt && !isCorrectOpt && <XCircle size={14} className="text-red-500 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {/* Detailed Breakdown */}
              <div className="pt-4 border-t border-white/5 space-y-3.5">
                <div className="p-4 bg-white/5 rounded-xl text-xs space-y-1.5 leading-relaxed text-gray-400">
                  <p className="font-bold text-gray-300">Detailed Explanation:</p>
                  <p>{q.explanation}</p>
                </div>

                {q.shortcut && (
                  <div className="p-4 bg-brand-primary/5 border border-brand-primary/10 rounded-xl text-xs space-y-1.5 leading-relaxed text-gray-400">
                    <p className="font-bold text-brand-primary flex items-center gap-1">
                      <Zap size={14} /> Shortcut Trick:
                    </p>
                    <p>{q.shortcut}</p>
                  </div>
                )}

                {q.aiExplanation && (
                  <div className="p-4 bg-[#0F172A] border border-white/5 rounded-xl text-xs space-y-1.5 leading-relaxed text-gray-400">
                    <p className="font-bold text-white flex items-center gap-1">
                      🤖 AI logic breakdown:
                    </p>
                    <p>{q.aiExplanation}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Weekly Exam Portal</h1>
        <p className="text-sm text-gray-400">Participate in scheduled placement simulations and analyze your score rankings.</p>
      </div>

      {/* Live Exams Panel */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
          <span>Live Exams</span>
        </h2>
        {liveExams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {liveExams.map((exam) => (
              <div key={exam.id} className="p-6 rounded-2xl glass-panel relative overflow-hidden border border-brand-primary/20 bg-brand-primary/5 flex flex-col justify-between gap-5">
                <div className="absolute top-0 left-0 right-0 h-1 bg-brand-primary"></div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-brand-primary/20 text-brand-primary font-bold px-2 py-0.5 rounded border border-brand-primary/30 uppercase tracking-wide">
                      {exam.companyPattern} Pattern
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={14} /> {exam.duration} mins
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{exam.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar size={14} />
                    <span>Ends: {new Date(exam.endDate).toLocaleDateString()} at {new Date(exam.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {exam.categories.map((c: string) => (
                      <span key={c} className="text-[9px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-gray-400">{c}</span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleStartExam(exam.id)}
                  className="w-full py-3 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-brand-primary/20 transition-all text-xs flex items-center justify-center gap-1"
                >
                  Attempt Exam <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl glass-panel text-center text-xs text-gray-500">No active live exams found for this week.</div>
        )}
      </div>

      {/* Upcoming Exams Panel */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Upcoming Exams</h2>
        {upcomingExams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingExams.map((exam) => (
              <div key={exam.id} className="p-5 rounded-xl glass-panel space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-gray-400 font-bold uppercase">
                    {exam.companyPattern}
                  </span>
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Clock size={12} /> {exam.duration}m
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm truncate">{exam.name}</h4>
                <p className="text-[10px] text-gray-400 flex items-center gap-1.5">
                  <Calendar size={12} />
                  Starts: {new Date(exam.startDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl glass-panel text-center text-xs text-gray-500">No scheduled upcoming exams. Check back later!</div>
        )}
      </div>

      {/* Completed Exam History */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Completed Exams</h2>
        {completedExams.length > 0 ? (
          <div className="space-y-3">
            {completedExams.map((exam) => {
              const activeResult = exam.activeResultId;
              return (
                <div key={exam.id} className="p-5 rounded-xl glass-panel flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">{exam.name}</h4>
                    <p className="text-[10px] text-gray-400">
                      Pattern: <span className="text-gray-300 font-semibold">{exam.companyPattern}</span> | Duration: {exam.duration}m | Questions: {exam.totalQuestions}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-end">
                    {exam.isAttempted ? (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Your Score</p>
                        <p className="text-sm font-bold text-brand-primary">{exam.percentage}%</p>
                      </div>
                    ) : (
                      <span className="text-xs text-red-400 font-semibold">Missed / Unattempted</span>
                    )}

                    {exam.isAttempted && (
                      <button
                        onClick={() => loadAnalysis(exam.results[0].id)}
                        className="px-4 py-2 bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold rounded-lg text-white transition-all flex items-center gap-1"
                      >
                        Analysis <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-xl glass-panel text-center text-xs text-gray-500">No completed exams history found.</div>
        )}
      </div>
    </div>
  );
};
