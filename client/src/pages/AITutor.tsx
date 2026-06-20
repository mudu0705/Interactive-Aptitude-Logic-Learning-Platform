import React from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { BrainCircuit, Send, MessageCircle, RefreshCw } from 'lucide-react';

export const AITutor: React.FC = () => {
  const [query, setQuery] = React.useState('');
  const [messages, setMessages] = React.useState<any[]>([
    { sender: 'AI', text: 'Hello! I am your AI placement tutor. Select a topic, ask any logical reasoning or aptitude doubt, or request a quick shortcut trick!' }
  ]);
  const [selectedTopic, setSelectedTopic] = React.useState('General Aptitude');
  const [loading, setLoading] = React.useState(false);

  const topicsList = ['General Aptitude', 'Time and Work', 'Syllogisms', 'Data Structures & Complexity'];

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage = { sender: 'USER', text: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.post('/ai/tutor', {
        topicName: selectedTopic,
        query: userMessage.text,
      });

      if (res.data.success) {
        setMessages((prev) => [...prev, { sender: 'AI', text: res.data.response }]);
      }
    } catch (err) {
      toast.error('AI Tutor is currently offline.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    setQuery(q);
  };

  const clearChat = () => {
    setMessages([
      { sender: 'AI', text: `Hello! I am your AI placement tutor. Select a topic, ask any logical reasoning or aptitude doubt, or request a quick shortcut trick!` }
    ]);
  };

  return (
    <div className="space-y-6 pb-12 flex flex-col h-[calc(100vh-140px)]">
      
      {/* Page Header */}
      <div className="flex justify-between items-center px-1 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-white">AI Tutor Workspace</h1>
          <p className="text-sm text-gray-400">Ask formulas, logic puzzles, or request shortcut methods.</p>
        </div>

        <button 
          onClick={clearChat}
          className="p-2.5 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all flex items-center gap-1.5"
        >
          <RefreshCw size={14} />
          <span className="hidden sm:inline">Reset Workspace</span>
        </button>
      </div>

      {/* Chat workspace container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        
        {/* Controls Sidebar */}
        <div className="space-y-4 shrink-0 lg:col-span-1 flex flex-col justify-start">
          <div className="p-5 rounded-2xl glass-panel space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Context Config</h4>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500">Active Syllabus Topic</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-brand-primary"
              >
                {topicsList.map((t) => (
                  <option key={t} value={t} className="bg-[#0D111E]">{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Preconfigured helper prompts */}
          <div className="p-5 rounded-2xl glass-panel space-y-3.5">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Suggestions</h4>
            <div className="space-y-2">
              <button 
                onClick={() => handleQuickQuestion('Can you give me a shortcut trick to solve Time and Work pipe problems quickly?')}
                className="w-full text-left text-[11px] p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg border border-transparent hover:border-white/5 transition-all leading-normal"
              >
                "Give me a pipe shortcut trick..."
              </button>
              <button 
                onClick={() => handleQuickQuestion('Explain the difference between categorical statements "All A are B" and "Some A are B" in Syllogisms.')}
                className="w-full text-left text-[11px] p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg border border-transparent hover:border-white/5 transition-all leading-normal"
              >
                "Explain statement differences in Syllogisms..."
              </button>
              <button 
                onClick={() => handleQuickQuestion('How do I quickly compute the average time complexity of Quick Sort?')}
                className="w-full text-left text-[11px] p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg border border-transparent hover:border-white/5 transition-all leading-normal"
              >
                "Time complexity of Quick Sort..."
              </button>
            </div>
          </div>
        </div>

        {/* Chat log body */}
        <div className="lg:col-span-3 flex flex-col rounded-2xl glass-panel overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-primary to-brand-accent"></div>
          
          {/* Scrollable messages box */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg, index) => {
              const isAI = msg.sender === 'AI';
              return (
                <div key={index} className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-xs md:text-sm leading-relaxed border ${
                    isAI 
                      ? 'bg-white/5 border-white/5 text-gray-300 rounded-tl-none' 
                      : 'bg-brand-primary/10 border-brand-primary/20 text-white rounded-tr-none'
                  }`}>
                    {isAI && (
                      <div className="flex items-center gap-1.5 text-brand-accent font-bold text-[10px] uppercase tracking-wider mb-1.5">
                        <BrainCircuit size={12} className="animate-pulse" />
                        <span>AI Placement Tutor</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap font-sans leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 justify-start py-2">
                <div className="max-w-[70%] p-4 rounded-2xl bg-white/5 border border-white/5 rounded-tl-none text-xs text-brand-primary font-semibold flex items-center gap-2 animate-pulse">
                  <BrainCircuit size={16} />
                  <span>AI Tutor is formulating explanation blueprint...</span>
                </div>
              </div>
            )}
          </div>

          {/* Form action footer */}
          <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-[#0A0D18]/50 flex gap-2 shrink-0">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Ask about ${selectedTopic}...`}
              className="flex-1 px-4 py-3 rounded-xl glass-input text-xs"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="p-3 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center shrink-0 disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
