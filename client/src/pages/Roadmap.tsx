import React from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useStore } from '../store/useStore';
import { Zap, Calendar, CheckSquare, Target, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export const Roadmap: React.FC = () => {
  const { user } = useStore();
  const [roadmap, setRoadmap] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const res = await api.get('/topics/roadmap');
        if (res.data.success) {
          setRoadmap(res.data.roadmap);
        }
      } catch (err) {
        toast.error('Failed to load study roadmap');
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmap();
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Personalized Study Roadmap</h1>
        <p className="text-sm text-gray-400">Custom pre-hiring schedule matched with target placements.</p>
      </div>

      <div className="space-y-6">
        {roadmap.map((weekItem, idx) => (
          <div key={idx} className="p-6 rounded-2xl glass-panel border border-white/5 space-y-4 relative overflow-hidden">
            {/* Left Accent Bar */}
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-brand-primary"></div>
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pl-2">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-brand-primary" />
                <h3 className="font-extrabold text-white text-base">Week {weekItem.week}: {weekItem.theme}</h3>
              </div>
              <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/25 px-3 py-1 rounded-full uppercase self-start sm:self-auto">
                In Progress
              </span>
            </div>

            {/* Task list */}
            <div className="space-y-3.5 pt-2 pl-2">
              {weekItem.tasks.map((task: any, taskIdx: number) => (
                <div key={taskIdx} className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckSquare size={16} className="text-brand-accent shrink-0" />
                      <h4 className="font-bold text-white text-sm">{task.topic}</h4>
                    </div>
                    <p className="text-xs text-gray-400 leading-normal pl-6">{task.reason}</p>
                  </div>

                  <Link 
                    to="/categories" 
                    className="self-start sm:self-auto px-4 py-2 bg-white/5 hover:bg-brand-primary hover:text-white border border-white/10 hover:border-brand-primary text-[10px] font-bold text-gray-300 rounded-lg transition-all flex items-center gap-1.5"
                  >
                    <BookOpen size={12} />
                    <span>Study Syllabus</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
