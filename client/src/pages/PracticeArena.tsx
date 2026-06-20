import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Zap, 
  Clock, 
  HelpCircle, 
  Bookmark, 
  Award, 
  ArrowRight, 
  AlertCircle,
  Lightbulb,
  CheckCircle,
  XCircle,
  BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PracticeArena: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { updateXPAndCoins } = useStore();

  const [questions, setQuestions] = React.useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [difficulty, setDifficulty] = React.useState('');

  // Practice state
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [timer, setTimer] = React.useState(0);
  const [showHint, setShowHint] = React.useState(false);
  const [bookmarked, setBookmarked] = React.useState(false);

  // Response Feedback state
  const [feedback, setFeedback] = React.useState<any>(null);

  // AI Explanation modal state
  const [aiExplainText, setAiExplainText] = React.useState('');
  const [loadingAI, setLoadingAI] = React.useState(false);

  // Increment timer every second
  React.useEffect(() => {
    let interval: any;
    if (!hasSubmitted && !loading) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [hasSubmitted, loading]);

  const fetchQuestions = React.useCallback(async () => {
    setLoading(true);
    setHasSubmitted(false);
    setSelectedOption(null);
    setFeedback(null);
    setTimer(0);
    setShowHint(false);
    setBookmarked(false);
    setAiExplainText('');

    try {
      const res = await api.get(`/practice/sessions/${sessionId}/questions`);
      if (res.data.success) {
        setQuestions(res.data.questions);
        setDifficulty(res.data.difficulty);
        setCurrentIdx(0);
      }
    } catch (err) {
      toast.error('Failed to load practice questions');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [sessionId, navigate]);

  React.useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSubmitAnswer = async () => {
    if (!selectedOption || submitting || !questions[currentIdx]) return;
    setSubmitting(true);
    const question = questions[currentIdx];
    const isCorrect = selectedOption === question.correctAnswer;

    try {
      const res = await api.post(`/practice/sessions/${sessionId}/submit`, {
        questionId: question.id,
        isCorrect,
        timeTakenSeconds: timer,
        confidence: timer < 15 ? 'HIGH' : timer < 45 ? 'MEDIUM' : 'LOW',
      });

      if (res.data.success) {
        setFeedback(res.data);
        setHasSubmitted(true);
        // Sync Zustand store
        updateXPAndCoins(res.data.xpEarned, res.data.coinsEarned, res.data.newLevel);

        if (res.data.unlockedAchievements?.length > 0) {
          res.data.unlockedAchievements.forEach((ach: string) => {
            toast.success(`Achievement Unlocked: ${ach}!`, { icon: '🏆' });
          });
        }
      }
    } catch (err) {
      toast.error('Failed to submit question response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAskAIExplanation = async () => {
    if (!questions[currentIdx]) return;
    setLoadingAI(true);
    try {
      const res = await api.post('/ai/tutor', {
        topicName: 'Problem Resolution',
        query: `Explain why this question is correct: "${questions[currentIdx].text}". Options: ${questions[currentIdx].options.join(', ')}. Correct answer is: ${questions[currentIdx].correctAnswer}. Provide a detailed explanation, logical steps, and a shortcut formula to compute it.`,
      });
      if (res.data.success) {
        setAiExplainText(res.data.response);
      }
    } catch (err) {
      toast.error('AI Tutor is currently busy.');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
      setHasSubmitted(false);
      setSelectedOption(null);
      setFeedback(null);
      setTimer(0);
      setShowHint(false);
      setBookmarked(false);
      setAiExplainText('');
    } else {
      // Reload next batch of questions (unlimited practice path!)
      toast.success('Batch completed! Fetching next set based on your dynamic difficulty...');
      fetchQuestions();
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-8 rounded-2xl glass-panel text-center space-y-4 max-w-xl mx-auto">
        <AlertCircle size={40} className="mx-auto text-yellow-500" />
        <h3 className="text-xl font-bold">No Questions Found</h3>
        <p className="text-sm text-gray-400">There are no practice questions seeded in this difficulty category yet. Try asking your Admin to generate some using AI.</p>
        <button onClick={() => navigate('/categories')} className="px-5 py-2.5 bg-brand-primary rounded-xl text-xs font-bold text-white">Back to Syllabus</button>
      </div>
    );
  }

  const activeQuestion = questions[currentIdx];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      
      {/* Header bar tracking progress */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold bg-brand-primary/10 border border-brand-primary/25 px-3 py-1 rounded-full text-brand-primary capitalize">
            {difficulty}
          </span>
          <span className="text-xs text-gray-500 font-semibold">Question {currentIdx + 1} of {questions.length}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
            <Clock size={14} />
            <span>{formatTime(timer)}</span>
          </div>

          <button 
            onClick={() => {
              setBookmarked(!bookmarked);
              toast.success(bookmarked ? 'Bookmark removed' : 'Question bookmarked!');
            }}
            className={`p-1.5 rounded-lg border ${bookmarked ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' : 'border-white/5 text-gray-500 hover:text-white'}`}
          >
            <Bookmark size={15} />
          </button>
        </div>
      </div>

      {/* Main Practice card */}
      <div className="p-6 md:p-8 rounded-2xl glass-panel space-y-6 relative overflow-hidden">
        {/* Glowing top line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-primary to-brand-accent"></div>

        {/* Question Text */}
        <p className="text-base md:text-lg font-bold text-white leading-relaxed">{activeQuestion.text}</p>

        {/* Options grid */}
        <div className="space-y-3">
          {activeQuestion.options.map((opt: string) => {
            const isSelected = selectedOption === opt;
            const showCorrect = hasSubmitted && opt === activeQuestion.correctAnswer;
            const showWrong = hasSubmitted && isSelected && opt !== activeQuestion.correctAnswer;

            return (
              <button
                key={opt}
                disabled={hasSubmitted}
                onClick={() => setSelectedOption(opt)}
                className={`w-full text-left p-4 rounded-xl transition-all border flex items-center justify-between font-medium text-xs md:text-sm ${
                  showCorrect 
                    ? 'bg-green-500/10 border-green-500 text-green-400' 
                    : showWrong 
                    ? 'bg-red-500/10 border-red-500 text-red-400' 
                    : isSelected 
                    ? 'bg-brand-primary/20 border-brand-primary text-white' 
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <span>{opt}</span>
                {showCorrect && <CheckCircle size={16} className="text-green-500 shrink-0" />}
                {showWrong && <XCircle size={16} className="text-red-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Options controller action footer */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
          <button
            onClick={() => setShowHint(true)}
            className="px-4 py-2 bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold rounded-lg text-gray-400 hover:text-white transition-all flex items-center gap-1.5"
          >
            <Lightbulb size={14} className="text-yellow-400" />
            <span>Show Hint</span>
          </button>

          {!hasSubmitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedOption || submitting}
              className="ml-auto px-6 py-2.5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold text-xs rounded-xl hover:shadow-lg transition-all"
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          ) : (
            <div className="ml-auto flex gap-2">
              <button
                onClick={handleAskAIExplanation}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold rounded-lg text-white flex items-center gap-1.5"
              >
                <BrainCircuit size={14} className="text-brand-accent animate-pulse" />
                <span>Explain with AI</span>
              </button>

              <button
                onClick={handleNext}
                className="px-5 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
              >
                <span>{currentIdx + 1 === questions.length ? 'Complete Set' : 'Next Question'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Accordion Hint display panel */}
      {showHint && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-xl bg-yellow-500/5 border border-yellow-500/10 text-xs text-yellow-200/80 leading-relaxed"
        >
          <p className="font-bold mb-1">Hint Direction:</p>
          <p>Consider formulating relative formulas or ratios. For time equations, check the rate of completion per hour.</p>
        </motion.div>
      )}

      {/* Gamification feedback display */}
      <AnimatePresence>
        {hasSubmitted && feedback && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-2xl glass-panel space-y-4 border-l-4 border-l-brand-primary"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm">Question Feedback Metrics</h4>
              <span className="text-[10px] text-gray-500 font-mono">Dynamic Adaptive Engine Response</span>
            </div>
            
            {/* XP and Coin alerts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-xl text-center">
                <span className="text-[10px] text-gray-400 font-semibold block mb-0.5">XP Earned</span>
                <p className="text-lg font-extrabold text-brand-primary">+{feedback.xpEarned} XP</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl text-center">
                <span className="text-[10px] text-gray-400 font-semibold block mb-0.5">Coins Earned</span>
                <p className="text-lg font-extrabold text-yellow-400">+{feedback.coinsEarned}</p>
              </div>
            </div>

            {/* Level up alerts */}
            {feedback.levelUp && (
              <div className="p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-xl text-center font-bold text-sm text-white flex items-center justify-center gap-2 animate-bounce">
                <Award className="text-brand-accent animate-pulse" />
                <span>LEVELED UP TO LEVEL {feedback.newLevel}!</span>
              </div>
            )}

            {/* Adaptive upgrade alerts */}
            <p className="text-xs text-gray-300 italic">{feedback.adaptiveFeedback}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Static text explanation */}
      {hasSubmitted && activeQuestion.explanation && (
        <div className="p-6 rounded-2xl glass-panel space-y-2.5">
          <h4 className="text-sm font-bold text-white">Default Textbook Solution</h4>
          <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{activeQuestion.explanation}</p>
        </div>
      )}

      {/* AI Explanation display panel */}
      {aiExplainText && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl glass-panel border border-brand-accent/20 bg-brand-accent/5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <BrainCircuit size={18} className="text-brand-accent" />
            <h4 className="text-sm font-bold text-white">AI Tutor Step-by-Step Explanation</h4>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">{aiExplainText}</p>
        </motion.div>
      )}

      {loadingAI && (
        <div className="text-center font-bold text-xs text-brand-primary animate-pulse py-2 flex items-center justify-center gap-2">
          <BrainCircuit size={16} />
          <span>AI is deriving solution blueprint...</span>
        </div>
      )}

    </div>
  );
};
