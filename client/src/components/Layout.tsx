import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  LayoutDashboard, 
  BookOpen, 
  Gamepad, 
  MessageSquare, 
  Brain, 
  FileText, 
  UserCheck, 
  Award, 
  LogOut, 
  Flame, 
  Coins, 
  Zap, 
  Sun, 
  Moon,
  Menu,
  X,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, theme, toggleTheme } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Weekly Exams', path: '/weekly-exams', icon: Trophy },
    { name: 'Learn Categories', path: '/categories', icon: BookOpen },
    { name: 'AI Tutor', path: '/ai-tutor', icon: Brain },
    { name: 'Personal Roadmap', path: '/roadmap', icon: Zap },
    { name: 'ATS Resume Checker', path: '/ats-checker', icon: FileText },
    { name: 'Mock Interview', path: '/mock-interview', icon: UserCheck },
    { name: 'Discussion Forum', path: '/forum', icon: MessageSquare },
    { name: 'Certificates', path: '/dashboard?tab=certificates', icon: Award },
  ];

  // Add Admin console if user is Admin
  if (user?.role === 'ADMIN') {
    menuItems.push({ name: 'Admin Console', path: '/admin', icon: LayoutDashboard });
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#070A13] overflow-x-hidden stars-bg text-gray-100">
      
      {/* Mobile Header Bar */}
      <header className="md:hidden flex items-center justify-between p-4 bg-[#0D111E]/80 backdrop-blur-md border-b border-white/5 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-gradient">AptitudeAI</span>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-full text-xs font-semibold">
              <Flame size={14} className="text-orange-500 fill-orange-500" />
              <span>{user.streak}d</span>
            </div>
          )}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1.5 bg-white/5 rounded-lg">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 p-5 bg-[#0A0D18]/70 backdrop-blur-xl border-r border-white/5 shrink-0">
        <div className="flex items-center gap-3 mb-8 px-2">
          <span className="text-2xl font-extrabold text-gradient">AptitudeAI</span>
          <span className="text-[10px] bg-brand-primary/20 text-brand-primary font-bold px-2 py-0.5 rounded-full border border-brand-primary/30">V1.0</span>
        </div>

        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-brand-primary/10 border border-brand-primary/25 text-white font-medium' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-brand-primary' : 'text-gray-400 group-hover:text-brand-primary transition-colors'} />
                <span>{item.name}</span>
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute left-0 w-1 h-6 bg-brand-primary rounded-r-md"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer block */}
        {user && (
          <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-3">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center font-bold text-white text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all font-medium"
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Slide-out Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="md:hidden fixed inset-0 z-40 bg-[#070A13]/95 flex flex-col p-6 pt-20 border-r border-white/10"
          >
            <nav className="space-y-2 flex-1 overflow-y-auto">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                      isActive ? 'bg-brand-primary/20 text-white border border-brand-primary/30' : 'text-gray-400'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-brand-primary' : 'text-gray-400'} />
                    <span className="text-base">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            {user && (
              <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 justify-center py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-medium"
                >
                  <LogOut size={18} />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar Dashboard Widgets (Desktop) */}
        {user && (
          <header className="hidden md:flex items-center justify-between px-8 py-4 bg-[#0A0D18]/30 border-b border-white/5 z-30">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Target Companies:</span>
              <div className="flex items-center gap-1.5">
                {user.targetCompanies.length > 0 ? (
                  user.targetCompanies.map((c) => (
                    <span key={c} className="text-[11px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-300 font-medium">{c}</span>
                  ))
                ) : (
                  <span className="text-[11px] text-gray-500">None selected</span>
                )}
              </div>
            </div>

            {/* Profile XP & Level Metrics */}
            <div className="flex items-center gap-6">
              {/* Level Indicator */}
              <div className="flex items-center gap-2 bg-brand-primary/10 border border-brand-primary/20 px-3.5 py-1.5 rounded-full">
                <Zap size={15} className="text-brand-primary fill-brand-primary animate-pulse" />
                <span className="text-xs font-bold text-white">LEVEL {user.level}</span>
              </div>

              {/* XP progress */}
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Total Progress</p>
                  <p className="text-sm font-bold text-white">{user.xp} XP</p>
                </div>
              </div>

              {/* Coins counter */}
              <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/25 px-3 py-1.5 rounded-full">
                <Coins size={15} className="text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-bold text-yellow-400">{user.coins}</span>
              </div>

              {/* Learning Streak */}
              <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 px-3 py-1.5 rounded-full">
                <Flame size={15} className="text-orange-500 fill-orange-500" />
                <span className="text-sm font-bold text-orange-500">{user.streak} Days Streak</span>
              </div>

              {/* Theme toggle */}
              <button 
                onClick={toggleTheme} 
                className="p-2 bg-white/5 rounded-full border border-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </header>
        )}

        {/* Dynamic Page Router Mount */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
