import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  BookOpen, 
  HelpCircle, 
  ArrowLeft, 
  Zap, 
  Award, 
  Play, 
  FileText, 
  BrainCircuit,
  MessageCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TopicDetail: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [topic, setTopic] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [startingSession, setStartingSession] = React.useState(false);

  // AI Drawer state
  const [aiDrawerOpen, setAiDrawerOpen] = React.useState(false);
  const [aiQuery, setAiQuery] = React.useState('');
  const [aiResponse, setAiResponse] = React.useState('');
  const [loadingAI, setLoadingAI] = React.useState(false);

  React.useEffect(() => {
    const fetchTopic = async () => {
      try {
        const res = await api.get(`/topics/topics/${slug}`);
        if (res.data.success) {
          setTopic(res.data.topic);
        }
      } catch (err) {
        toast.error('Failed to load topic details');
        navigate('/categories');
      } finally {
        setLoading(false);
      }
    };
    fetchTopic();
  }, [slug, navigate]);

  const handleStartPractice = async () => {
    if (!topic) return;
    setStartingSession(true);
    try {
      const res = await api.post('/practice/sessions', { topicId: topic.id });
      if (res.data.success) {
        navigate(`/practice/${res.data.session.id}`);
      }
    } catch (err) {
      toast.error('Failed to initialize practice session');
    } finally {
      setStartingSession(false);
    }
  };

  const handleAskTutor = async () => {
    if (!aiQuery.trim() || !topic) return;
    setLoadingAI(true);
    setAiResponse('');
    try {
      const res = await api.post('/ai/tutor', {
        topicName: topic.name,
        query: aiQuery,
      });
      if (res.data.success) {
        setAiResponse(res.data.response);
      }
    } catch (err) {
      toast.error('AI Tutor is busy. Please try again.');
    } finally {
      setLoadingAI(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative pb-20">
      
      {/* Back navigation */}
      <button 
        onClick={() => navigate('/categories')} 
        className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Categories</span>
      </button>

      {/* Header and Call to Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs text-brand-primary font-bold uppercase tracking-wider bg-brand-primary/10 border border-brand-primary/25 px-3 py-1 rounded-full">
            {topic.category?.name}
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-2">{topic.name}</h1>
          <p className="text-sm text-gray-400 mt-1">{topic.description}</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => setAiDrawerOpen(true)}
            className="flex-1 md:flex-none px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all"
          >
            <BrainCircuit size={16} className="text-brand-accent animate-pulse" />
            <span>Ask AI Tutor</span>
          </button>
          
          <button
            onClick={handleStartPractice}
            disabled={startingSession}
            className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-brand-primary/25 text-xs transition-all flex items-center justify-center gap-2"
          >
            {startingSession ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Zap size={16} />
                <span>Start Adaptive Practice</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main theory content */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="p-6 md:p-8 rounded-2xl glass-panel space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen size={18} className="text-brand-primary" />
              <span>Theory & Concept Framework</span>
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{topic.theory}</p>
          </div>

          {/* Core Examples list */}
          {topic.examples && topic.examples.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white px-1">Walkthrough Examples</h3>
              <div className="space-y-4">
                {topic.examples.map((ex: any, idx: number) => (
                  <div key={idx} className="p-6 rounded-2xl glass-panel border border-white/5 space-y-3">
                    <span className="text-[10px] font-bold bg-white/5 text-gray-400 px-2 py-0.5 rounded">Example {idx + 1}</span>
                    <h4 className="font-bold text-white text-sm">{ex.question}</h4>
                    <div className="p-4 bg-brand-primary/5 border border-brand-primary/10 rounded-xl space-y-2">
                      <p className="text-xs font-bold text-brand-primary">Solution:</p>
                      <p className="text-xs text-gray-300 font-mono">{ex.solution}</p>
                      <p className="text-[11px] text-gray-500 italic mt-1">Note: {ex.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Formulas and Tricks */}
        <div className="space-y-6">
          {/* Formulas list */}
          {topic.formula && topic.formula.length > 0 && (
            <div className="p-6 rounded-2xl glass-panel space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText size={16} className="text-brand-primary" />
                <span>Formulas Checklist</span>
              </h3>
              <div className="space-y-3.5">
                {topic.formula.map((form: any, idx: number) => (
                  <div key={idx} className="space-y-1 p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-xs font-bold text-white">{form.name}</p>
                    <p className="text-xs font-bold text-brand-accent font-mono">{form.expression}</p>
                    <p className="text-[10px] text-gray-400">{form.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shortcut tricks list */}
          {topic.shortcuts && topic.shortcuts.length > 0 && (
            <div className="p-6 rounded-2xl glass-panel space-y-4 border border-brand-accent/15">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap size={16} className="text-brand-accent" />
                <span>Shortcut & Tricks</span>
              </h3>
              <div className="space-y-3.5">
                {topic.shortcuts.map((trick: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <p className="text-xs font-bold text-white">{trick.title}</p>
                    <p className="text-xs text-gray-400 italic">"{trick.trick}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Notes Panel placeholder */}
          <div className="p-6 rounded-2xl glass-panel text-center space-y-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-brand-primary/5 group-hover:bg-brand-primary/10 transition-colors pointer-events-none"></div>
            <div className="w-12 h-12 bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto text-brand-primary border border-brand-primary/30">
              <Play size={20} className="fill-brand-primary ml-0.5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white">Visual Video Lecture</h4>
              <p className="text-[10px] text-gray-500">Access pre-recorded workspace classroom tutorials.</p>
            </div>
            <button 
              onClick={() => toast.success('Mock classroom video loaded')}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold rounded-lg transition-all"
            >
              Play Tutorial
            </button>
          </div>
        </div>

      </div>

      {/* Floating AI Tutor Drawer */}
      <AnimatePresence>
        {aiDrawerOpen && (
          <>
            {/* Overlay background */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setAiDrawerOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0D111E] border-l border-white/10 p-6 z-50 flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="text-brand-primary animate-pulse" />
                  <div>
                    <h3 className="font-bold text-white">AI Tutor Assistant</h3>
                    <p className="text-[10px] text-gray-500">Explaining: {topic.name}</p>
                  </div>
                </div>
                <button onClick={() => setAiDrawerOpen(false)} className="p-1 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Chat log output */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {aiResponse ? (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs leading-relaxed overflow-x-auto text-gray-300">
                    <p className="font-bold text-brand-primary mb-1">Tutor Response:</p>
                    {/* Simplified render for markdown in SVG/Theory context */}
                    <div className="whitespace-pre-wrap font-sans">{aiResponse}</div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 space-y-2">
                    <MessageCircle size={36} className="text-gray-600" />
                    <p className="text-xs">Ask anything about formulas, shortcut methods, or step-by-step problems!</p>
                  </div>
                )}
                {loadingAI && (
                  <div className="flex items-center gap-2 text-xs text-brand-primary font-bold justify-center py-4 animate-pulse">
                    <BrainCircuit size={16} />
                    <span>AI is formulating solution...</span>
                  </div>
                )}
              </div>

              {/* Input console */}
              <div className="pt-4 border-t border-white/5 space-y-2">
                <textarea
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Ask a question (e.g. Can you explain combined rate logic in simpler steps?)"
                  rows={3}
                  className="w-full p-3 rounded-xl glass-input text-xs resize-none"
                />
                <button
                  onClick={handleAskTutor}
                  disabled={loadingAI || !aiQuery.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold text-xs rounded-xl hover:shadow-lg transition-all"
                >
                  Send Query
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
