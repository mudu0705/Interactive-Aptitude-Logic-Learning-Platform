import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Send,
  AlertCircle,
  HelpCircle,
  HelpCircle as HintIcon
} from 'lucide-react';

export const WeeklyExamScreen: React.FC = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = React.useState<any[]>([]);
  const [examName, setExamName] = React.useState('');
  const [attemptId, setAttemptId] = React.useState('');
  
  // Timer & navigation states
  const [timeRemaining, setTimeRemaining] = React.useState(0);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [showHint, setShowHint] = React.useState(false);
  
  // Calculate duration
  const [initialTimeRemaining, setInitialTimeRemaining] = React.useState(0);

  React.useEffect(() => {
    const initializeExam = async () => {
      try {
        const res = await api.post(`/weekly-exams/${examId}/start`);
        if (res.data.success) {
          setQuestions(res.data.questions);
          setExamName(res.data.name);
          setAttemptId(res.data.attemptId);
          setTimeRemaining(res.data.timeRemainingSeconds);
          setInitialTimeRemaining(res.data.timeRemainingSeconds);
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to start weekly exam');
        navigate('/weekly-exams');
      } finally {
        setLoading(false);
      }
    };

    initializeExam();
  }, [examId, navigate]);

  // Timer Tick Interval
  React.useEffect(() => {
    if (loading || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, timeRemaining]);

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers({
      ...answers,
      [questionId]: option,
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    toast.error('Time expired! Submitting your exam automatically...', { duration: 4000 });

    try {
      const answersList = Object.keys(answers).map((qId) => ({
        questionId: qId,
        selectedAnswer: answers[qId],
      }));

      const res = await api.post('/weekly-exams/submit', {
        examId: attemptId,
        timeTakenSeconds: initialTimeRemaining,
        answers: answersList,
      });

      if (res.data.success) {
        toast.success('Exam submitted automatically');
        navigate('/weekly-exams');
      }
    } catch (err) {
      toast.error('Failed to submit exam');
      navigate('/weekly-exams');
    }
  };

  const handleSubmit = async () => {
    const unansweredCount = questions.length - Object.keys(answers).length;
    const confirmMsg = unansweredCount > 0 
      ? `You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`
      : 'Are you sure you want to conclude and submit your weekly exam?';

    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    try {
      const answersList = Object.keys(answers).map((qId) => ({
        questionId: qId,
        selectedAnswer: answers[qId],
      }));

      const timeSpent = initialTimeRemaining - timeRemaining;

      const res = await api.post('/weekly-exams/submit', {
        examId: attemptId,
        timeTakenSeconds: timeSpent,
        answers: answersList,
      });

      if (res.data.success) {
        toast.success('Weekly Exam submitted successfully!');
        navigate('/weekly-exams');
      }
    } catch (err) {
      toast.error('Submission failed. Please check network connectivity.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A13] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const isSelected = (opt: string) => answers[currentQuestion.id] === opt;

  return (
    <div className="min-h-screen bg-[#070A13] text-gray-100 flex flex-col relative stars-bg">
      {/* Header bar */}
      <header className="px-6 py-4 bg-[#0D111E]/80 backdrop-blur-md border-b border-white/5 flex justify-between items-center sticky top-0 z-30">
        <div>
          <h2 className="text-base font-bold text-white truncate max-w-xs sm:max-w-md">{examName}</h2>
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Question {currentIndex + 1} of {totalQuestions}</p>
        </div>

        {/* Timer Box */}
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 px-4 py-2 rounded-xl text-red-400 font-extrabold text-sm tracking-wide">
          <Clock size={16} className="animate-pulse" />
          <span>{formatTime(timeRemaining)}</span>
        </div>
      </header>

      {/* Main Board */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col justify-between gap-8 z-10 relative">
        <div className="space-y-6">
          {/* Progress indicators */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {questions.map((q, idx) => {
              const answered = answers[q.id] !== undefined;
              const active = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${
                    active 
                      ? 'bg-brand-primary border-brand-primary text-white scale-110 shadow-lg shadow-brand-primary/20' 
                      : answered 
                        ? 'bg-brand-primary/10 border-brand-primary/30 text-white' 
                        : 'bg-white/5 border-white/5 text-gray-500 hover:text-white'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Question Statement Card */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-wider">
              <span>Marks: {currentQuestion.marks}</span>
              <span>Time Target: {currentQuestion.estimatedSolvingTime}s</span>
            </div>

            <p className="text-base font-medium text-gray-200 leading-relaxed whitespace-pre-wrap">{currentQuestion.text}</p>

            {currentQuestion.aiHint && (
              <div className="pt-2">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="text-xs text-brand-primary hover:underline font-semibold flex items-center gap-1"
                >
                  <HintIcon size={14} />
                  <span>{showHint ? 'Hide Hint' : 'Show AI Hint'}</span>
                </button>
                {showHint && (
                  <div className="mt-2 p-3 bg-brand-primary/5 border border-brand-primary/15 rounded-xl text-xs text-gray-400 leading-relaxed">
                    {currentQuestion.aiHint}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Options grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQuestion.options.map((opt: string) => {
              const selected = isSelected(opt);
              return (
                <button
                  key={opt}
                  onClick={() => handleSelectOption(currentQuestion.id, opt)}
                  className={`p-4 rounded-xl border text-left text-xs font-medium transition-all flex justify-between items-center ${
                    selected 
                      ? 'bg-brand-primary/20 border-brand-primary text-white font-semibold shadow-lg shadow-brand-primary/10' 
                      : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{opt}</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selected ? 'border-brand-primary bg-brand-primary' : 'border-gray-600'}`}>
                    {selected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex justify-between items-center gap-4 pt-4 border-t border-white/5 mt-auto">
          <button
            disabled={currentIndex === 0}
            onClick={() => {
              setCurrentIndex(currentIndex - 1);
              setShowHint(false);
            }}
            className="px-5 py-3 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-gray-300 hover:text-white disabled:opacity-30 disabled:hover:text-gray-300 transition-all flex items-center gap-1"
          >
            <ChevronLeft size={16} /> Previous
          </button>

          {currentIndex < totalQuestions - 1 ? (
            <button
              onClick={() => {
                setCurrentIndex(currentIndex + 1);
                setShowHint(false);
              }}
              className="px-5 py-3 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-gray-300 hover:text-white transition-all flex items-center gap-1"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-brand-primary/25 transition-all text-xs flex items-center gap-1.5"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Send size={14} /> Submit Exam
                </>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
