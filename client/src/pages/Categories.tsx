import React from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { BookOpen, HelpCircle, ArrowRight, Layers } from 'lucide-react';

export const Categories: React.FC = () => {
  const [categories, setCategories] = React.useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<any | null>(null);
  const [topics, setTopics] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingTopics, setLoadingTopics] = React.useState(false);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/topics/categories');
        if (res.data.success) {
          setCategories(res.data.categories);
          // Set first category selected by default
          if (res.data.categories.length > 0) {
            handleCategorySelect(res.data.categories[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleCategorySelect = async (cat: any) => {
    setSelectedCategory(cat);
    setLoadingTopics(true);
    try {
      const res = await api.get(`/topics/categories/${cat.slug}/topics`);
      if (res.data.success) {
        setTopics(res.data.topics);
      }
    } catch (err) {
      console.error('Failed to load category topics:', err);
    } finally {
      setLoadingTopics(false);
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Learning Domains</h1>
        <p className="text-sm text-gray-400">Select a placement domain module below to browse theory and exercises.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Category List */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Syllabus Domains</h3>
          <div className="space-y-2">
            {categories.map((cat) => {
              const selected = selectedCategory?.id === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className={`w-full text-left p-4 rounded-xl transition-all border flex items-center justify-between group ${
                    selected 
                      ? 'bg-brand-primary/10 border-brand-primary text-white shadow-md' 
                      : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm">{cat.name}</p>
                    <p className="text-[10px] text-gray-500">{cat._count?.topics || 0} topics included</p>
                  </div>
                  <ArrowRight size={14} className={`transition-transform ${selected ? 'text-brand-primary translate-x-0.5' : 'text-gray-600 group-hover:translate-x-0.5'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Topics detail view */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {selectedCategory ? `${selectedCategory.name} Syllabus` : 'Topics Listing'}
            </h3>
            <span className="text-xs text-gray-500 font-semibold">{topics.length} topics found</span>
          </div>

          {loadingTopics ? (
            <div className="p-12 glass-panel rounded-2xl flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {topics.length > 0 ? (
                topics.map((topic) => (
                  <div 
                    key={topic.id}
                    className="p-6 rounded-2xl glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-brand-primary"
                  >
                    <div className="space-y-1 flex-1">
                      <h4 className="text-lg font-bold text-white">{topic.name}</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">{topic.description}</p>
                    </div>
                    
                    <Link
                      to={`/topics/${topic.slug}`}
                      className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white text-xs font-bold rounded-xl transition-all self-start sm:self-auto flex items-center gap-1.5"
                    >
                      <span>Study & Drill</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="p-12 glass-panel rounded-2xl text-center space-y-2 text-gray-500">
                  <Layers size={36} className="mx-auto text-gray-600" />
                  <p className="text-sm">No topics available in this category yet.</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
