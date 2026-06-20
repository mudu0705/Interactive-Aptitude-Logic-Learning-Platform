import React from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  UserCheck, 
  Send, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  StopCircle, 
  Award, 
  CheckCircle,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const MockInterview: React.FC = () => {
  const [company, setCompany] = React.useState('TCS');
  const [interviewStarted, setInterviewStarted] = React.useState(false);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [userInput, setUserInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<any>(null);

  // HTML5 Web Speech toggles
  const [voiceMode, setVoiceMode] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);

  const companiesList = ['TCS', 'Infosys', 'Accenture', 'Capgemini', 'Wipro', 'Cognizant'];

  // Initialize Speech Recognition
  React.useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setUserInput(text);
        setIsListening(false);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const handleStartInterview = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.post('/ai/interview/start', { company });
      if (res.data.success) {
        setMessages([{ sender: 'AI', text: res.data.message }]);
        setInterviewStarted(true);
        if (voiceMode) {
          speak(res.data.message);
        }
      }
    } catch (err) {
      toast.error('Failed to start interview session');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResponse = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || loading) return;

    const text = userInput;
    setMessages((prev) => [...prev, { sender: 'USER', text }]);
    setUserInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/interview/respond', { message: text, company });
      if (res.data.success) {
        setMessages((prev) => [...prev, { sender: 'AI', text: res.data.message }]);
        if (voiceMode) {
          speak(res.data.message);
        }
      }
    } catch (err) {
      toast.error('Interview bot is disconnected.');
    } finally {
      setLoading(false);
    }
  };

  const handleEndInterview = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ai/interview/end', { company });
      if (res.data.success) {
        setFeedback(res.data.feedback);
        setInterviewStarted(false);
        setMessages([]);
        toast.success('Interview evaluated. View report below!');
      }
    } catch (err) {
      toast.error('Failed to evaluate mock interview');
    } finally {
      setLoading(false);
    }
  };

  // Speak AI responses
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel active speaking first
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Dictate user answers
  const toggleListening = () => {
    if (!recognitionRef.current) {
      return toast.error('Speech recognition not supported in this browser.');
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // Convert scores dictionary to chart format
  const getFeedbackChartData = () => {
    if (!feedback) return [];
    return [
      { name: 'Technical', score: feedback.technicalScore },
      { name: 'Confidence', score: feedback.confidenceScore },
      { name: 'Grammar', score: feedback.grammarScore },
      { name: 'Communication', score: feedback.communicationScore },
    ];
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-3xl font-extrabold text-white">AI Mock Interview Arena</h1>
          <p className="text-sm text-gray-400">Simulate company-specific behavioral and technical placement trials.</p>
        </div>

        {interviewStarted && (
          <button
            onClick={handleEndInterview}
            className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <StopCircle size={15} />
            <span>Finish Interview</span>
          </button>
        )}
      </div>

      {!interviewStarted && !feedback && (
        /* Configuration Card */
        <div className="max-w-md mx-auto p-6 rounded-2xl glass-panel space-y-6">
          <div className="text-center space-y-2">
            <UserCheck size={36} className="mx-auto text-brand-primary" />
            <h3 className="text-xl font-bold text-white">Setup Interview Instance</h3>
            <p className="text-xs text-gray-400">Select target recruiters to seed interview questions</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Target Corporate Client</label>
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white focus:outline-none"
              >
                {companiesList.map((c) => (
                  <option key={c} value={c} className="bg-[#0D111E]">{c}</option>
                ))}
              </select>
            </div>

            {/* Voice options */}
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div>
                <p className="text-xs font-bold text-white">Voice Synthesis Mode</p>
                <p className="text-[10px] text-gray-500">Read question prompts aloud</p>
              </div>
              <button
                onClick={() => setVoiceMode(!voiceMode)}
                className={`p-2 rounded-lg border ${voiceMode ? 'bg-brand-primary/20 border-brand-primary text-white' : 'border-white/5 text-gray-500'}`}
              >
                {voiceMode ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>

            <button
              onClick={handleStartInterview}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-xl hover:shadow-lg transition-all text-xs"
            >
              Start Placement Interview
            </button>
          </div>
        </div>
      )}

      {interviewStarted && (
        /* Chat simulation console */
        <div className="max-w-3xl mx-auto rounded-2xl glass-panel overflow-hidden flex flex-col h-[500px]">
          <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#0D111E]/40">
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-brand-primary" />
              <span className="text-xs font-bold text-white">{company} Placement Trial</span>
            </div>
            
            {/* Audio Synthesis controller */}
            <button
              onClick={() => {
                setVoiceMode(!voiceMode);
                if (!voiceMode && messages.length > 0) {
                  speak(messages[messages.length - 1].text);
                }
              }}
              className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400"
            >
              {voiceMode ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg, index) => {
              const isAI = msg.sender === 'AI';
              return (
                <div key={index} className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-xs md:text-sm border leading-relaxed ${
                    isAI 
                      ? 'bg-white/5 border-white/5 text-gray-300 rounded-tl-none' 
                      : 'bg-brand-primary/10 border-brand-primary/20 text-white rounded-tr-none'
                  }`}>
                    <p className="whitespace-pre-wrap font-sans leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 justify-start py-2">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 rounded-tl-none text-xs text-brand-primary font-semibold flex items-center gap-2 animate-pulse">
                  <span>AI Interviewer is analyzing response...</span>
                </div>
              </div>
            )}
          </div>

          {/* Form console */}
          <form onSubmit={handleSendResponse} className="p-4 border-t border-white/5 bg-[#0A0D18]/50 flex gap-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-xl border transition-all ${
                isListening 
                  ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' 
                  : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Speak or type your interview answer here..."
              className="flex-1 px-4 py-3 rounded-xl glass-input text-xs"
            />

            <button
              type="submit"
              disabled={loading || !userInput.trim()}
              className="p-3 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {feedback && !interviewStarted && (
        /* Detailed Feedback report card */
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
          
          <div className="p-6 rounded-2xl glass-panel flex flex-col md:flex-row justify-between items-center gap-6 border-l-4 border-l-brand-primary">
            <div className="space-y-2">
              <span className="text-[10px] text-brand-primary font-bold uppercase bg-brand-primary/10 border border-brand-primary/20 px-3 py-1 rounded-full">Interview Scorecard</span>
              <h3 className="text-xl font-bold text-white">{company} Mock Report</h3>
              <p className="text-xs text-gray-400 leading-normal">
                This diagnostic evaluates technical depth, language correctness, confidence metrics, and overall answer coherence.
              </p>
            </div>
            
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center bg-white/5 border border-white/5 rounded-full shadow-lg">
              <div className="text-center">
                <span className="text-4xl font-extrabold text-gradient">{feedback.overallScore}%</span>
                <span className="text-[10px] text-gray-500 block">Overall Index</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* Chart */}
            <div className="md:col-span-2 p-6 rounded-2xl glass-panel space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Metric Breakdown</h4>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getFeedbackChartData()}>
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
                    <Bar dataKey="score" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Suggestions list */}
            <div className="p-6 rounded-2xl glass-panel space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle size={14} className="text-green-500" />
                <span>Improvement Plan</span>
              </h4>
              <ul className="text-xs text-gray-400 space-y-2 list-disc pl-4 leading-normal">
                {feedback.constructiveFeedback.map((s: string, idx: number) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setFeedback(null)}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white rounded-xl transition-all"
            >
              Start Another Interview
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
