import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Brain, 
  Award, 
  Flame, 
  MessageSquare, 
  ChevronRight, 
  ShieldCheck, 
  CheckCircle,
  HelpCircle,
  Users,
  Briefcase
} from 'lucide-react';
import { useStore } from '../store/useStore';

export const Landing: React.FC = () => {
  const { isAuthenticated } = useStore();

  const features = [
    {
      title: 'Adaptive Difficulty Engine',
      description: 'System automatically scales question complexity from Easy to Expert depending on your performance metrics.',
      icon: Zap,
      color: 'text-yellow-400',
    },
    {
      title: 'AI Tutor Chatbot',
      description: 'Stuck on a tricky quantitative formula? Explain concepts, resolve doubts, and get shortcuts dynamically.',
      icon: Brain,
      color: 'text-purple-400',
    },
    {
      title: 'Resume ATS Checker',
      description: 'Scan your resume against technical job keywords, check format grammar, and predict placement alignment.',
      icon: Briefcase,
      color: 'text-blue-400',
    },
    {
      title: 'Mock Interview Simulator',
      description: 'Simulate conversational AI tech interviews (voice/text supported) and receive scores on grammar, competence, confidence.',
      icon: ShieldCheck,
      color: 'text-pink-400',
    },
  ];

  const categories = [
    { title: 'Quantitative Aptitude', count: '120+ Questions', icon: '🔢' },
    { title: 'Logical Reasoning', count: '95+ Questions', icon: '🧩' },
    { title: 'Verbal Ability', count: '80+ Questions', icon: '📝' },
    { title: 'Programming MCQs', count: '150+ Questions', icon: '💻' },
  ];

  const stats = [
    { value: '94%', label: 'Placement Rate' },
    { value: '10K+', label: 'Questions Solved' },
    { value: '8.4/10', label: 'Average ATS Score' },
    { value: '25+', label: 'Top Tier Companies' },
  ];

  const faqs = [
    {
      q: 'How does the adaptive difficulty algorithm work?',
      a: 'If you answer 3 consecutive questions correctly, the difficulty is upgraded (e.g. Medium to Hard). If you make 3 consecutive errors, the difficulty is reduced so you can build your fundamental understanding.'
    },
    {
      q: 'Can I verify the generated certificates?',
      a: 'Yes! Every certificate generated includes a unique ID and a QR code pointing to a verification page, making it fully verifiable by corporate recruiters.'
    },
    {
      q: 'What companies are covered in the Mock Tests?',
      a: 'We provide company-tailored tests for TCS, Infosys, Accenture, Capgemini, Wipro, and Cognizant.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#070A13] overflow-x-hidden relative text-gray-100 font-sans stars-bg">
      {/* Dynamic Floating Glow Rings */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 right-1/4 w-[450px] h-[450px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navigation Header */}
      <nav className="w-full px-6 py-5 md:px-12 flex justify-between items-center bg-[#0D111E]/40 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-gradient">AptitudeAI</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/forum" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Forum</Link>
          {isAuthenticated ? (
            <Link to="/dashboard" className="px-5 py-2.5 rounded-xl bg-brand-primary text-white font-medium hover:bg-brand-primary/95 transition-all text-sm">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Login</Link>
              <Link to="/signup" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold hover:shadow-lg hover:shadow-brand-primary/25 transition-all text-sm border border-brand-primary/30">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="px-6 md:px-12 pt-20 pb-16 flex flex-col items-center justify-center text-center max-w-5xl mx-auto z-10 relative">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 bg-brand-primary/10 border border-brand-primary/25 px-4 py-1.5 rounded-full text-xs font-bold text-brand-primary tracking-wide">
            <Flame size={14} className="fill-brand-primary" /> FINAL YEAR MAJOR CSE PROJECT
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Interactive Aptitude & <br/>
            <span className="text-gradient">Logic Learning Platform</span>
          </h1>
          <p className="text-base md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Master placement exams with adaptive mock tests, personalized roadmap study schedules, real-time AI tutor chatbots, resume ATS analyzer feedback, and mock interviews.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link 
              to={isAuthenticated ? '/dashboard' : '/signup'} 
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-primary to-brand-accent rounded-xl text-white font-bold hover:shadow-xl hover:shadow-brand-accent/25 transition-all flex items-center justify-center gap-2 group text-base"
            >
              Get Started Free <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#features" 
              className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition-all text-base flex items-center justify-center"
            >
              Explore Features
            </a>
          </div>
        </motion.div>
      </header>

      {/* Statistics Banner */}
      <section className="px-6 py-12 md:py-16 bg-[#0D111E]/40 border-y border-white/5 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, idx) => (
            <div key={idx} className="text-center space-y-1.5">
              <p className="text-3xl md:text-5xl font-extrabold text-gradient">{s.value}</p>
              <p className="text-xs md:text-sm font-semibold tracking-wide text-gray-400 uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="px-6 py-20 max-w-6xl mx-auto z-10 relative">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold">Next-Gen AI Learning Features</h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm md:text-base">Equipped with specialized engines to guide you step-by-step from beginner to placement ready.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="p-6 md:p-8 rounded-2xl glass-panel glass-panel-hover flex gap-5"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <Icon size={24} className={f.color} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold">{f.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Topic Categories Showcase */}
      <section className="px-6 py-20 bg-[#0A0D18]/50 border-t border-white/5 z-10 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold">Curated Placement Syllabus</h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm md:text-base">Comprehensive practice pathways mimicking major hiring screening questions.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((c, idx) => (
              <div key={idx} className="p-6 rounded-2xl glass-panel text-center space-y-3">
                <span className="text-3xl block" role="img" aria-label={c.title}>{c.icon}</span>
                <h3 className="font-bold text-sm md:text-base">{c.title}</h3>
                <span className="text-xs text-brand-primary bg-brand-primary/10 px-2.5 py-0.5 rounded-full border border-brand-primary/20 font-semibold">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordions */}
      <section className="px-6 py-20 max-w-4xl mx-auto z-10 relative">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl font-extrabold">Frequently Asked Questions</h2>
          <p className="text-gray-400 text-sm">Everything you need to know about our major project platform.</p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-6 rounded-xl glass-panel space-y-2">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-brand-primary" />
                <h3 className="font-bold text-base">{faq.q}</h3>
              </div>
              <p className="text-sm text-gray-400 pl-7 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-xs text-gray-500 border-t border-white/5 bg-[#080B15] relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 px-6">
          <p>© 2026 Interactive Aptitude & Logic Learning Platform. CSE Major Project.</p>
          <div className="flex gap-4">
            <span className="hover:text-gray-300 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-gray-300 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <Link to="/forum" className="hover:text-gray-300">Discussion Forum</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
