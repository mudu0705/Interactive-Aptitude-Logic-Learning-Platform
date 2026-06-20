import React from 'react';
import api from '../services/api';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';
import { 
  MessageSquare, 
  ThumbsUp, 
  Plus, 
  Search, 
  Bookmark, 
  User, 
  Clock, 
  MessageCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DiscussionForum: React.FC = () => {
  const { user } = useStore();
  
  const [posts, setPosts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeCategory, setActiveCategory] = React.useState('');
  
  // Selected post detail
  const [selectedPost, setSelectedPost] = React.useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [commentContent, setCommentContent] = React.useState('');

  // Create post modal
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [newContent, setNewContent] = React.useState('');
  const [newCategory, setNewCategory] = React.useState('General');

  const categories = ['General', 'Quantitative Aptitude', 'Logical Reasoning', 'Resume ATS Help', 'Mock Interview Prep'];

  const fetchPosts = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = activeCategory ? `/forum/posts?category=${encodeURIComponent(activeCategory)}` : '/forum/posts';
      const res = await api.get(url);
      if (res.data.success) {
        setPosts(res.data.posts);
      }
    } catch (err) {
      toast.error('Failed to load discussion posts');
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostClick = async (postId: string) => {
    setLoadingDetail(true);
    try {
      const res = await api.get(`/forum/posts/${postId}`);
      if (res.data.success) {
        setSelectedPost(res.data.post);
      }
    } catch (err) {
      toast.error('Failed to load post details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      return toast.error('Fill in all fields');
    }

    try {
      const res = await api.post('/forum/posts', {
        title: newTitle,
        content: newContent,
        category: newCategory,
      });

      if (res.data.success) {
        toast.success('Discussion thread created!');
        setShowCreateModal(false);
        setNewTitle('');
        setNewContent('');
        fetchPosts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create post');
    }
  };

  const handleLikePost = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/forum/posts/${postId}/like`);
      if (res.data.success) {
        // Optimistic toggle update
        setPosts((prev) => 
          prev.map((p) => {
            if (p.id === postId) {
              const diff = res.data.liked ? 1 : -1;
              return { ...p, likesCount: p.likesCount + diff, isLikedByUser: res.data.liked };
            }
            return p;
          })
        );
        if (selectedPost && selectedPost.id === postId) {
          const diff = res.data.liked ? 1 : -1;
          setSelectedPost({ ...selectedPost, likesCount: selectedPost.likesCount + diff, isLikedByUser: res.data.liked });
        }
      }
    } catch (err) {
      toast.error('Failed to register like');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !selectedPost) return;

    try {
      const res = await api.post(`/forum/posts/${selectedPost.id}/comments`, {
        content: commentContent,
      });

      if (res.data.success) {
        setSelectedPost({
          ...selectedPost,
          commentsCount: selectedPost.commentsCount + 1,
          comments: [...selectedPost.comments, res.data.comment],
        });
        setCommentContent('');
        toast.success('Comment posted!');
        // Update comments count in list
        setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, commentsCount: p.commentsCount + 1 } : p));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post comment');
    }
  };

  const formatPostTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Placement Discussion Forum</h1>
          <p className="text-sm text-gray-400">Share test patterns, ask doubt details, or discuss company interviews.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white text-xs font-bold rounded-xl hover:shadow-lg transition-all flex items-center gap-1.5"
        >
          <Plus size={16} />
          <span>New Thread</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Categories listing */}
        <div className="space-y-4 shrink-0 col-span-1">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Discussion Filters</h3>
          <div className="space-y-1">
            <button
              onClick={() => setActiveCategory('')}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeCategory === '' 
                  ? 'bg-brand-primary/10 text-brand-primary' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              All Threads
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeCategory === cat 
                    ? 'bg-brand-primary/10 text-brand-primary' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Center threads listing */}
        <div className="lg:col-span-3 space-y-4">
          
          {loading ? (
            <div className="p-12 glass-panel rounded-2xl flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => handlePostClick(post.id)}
                    className="p-6 rounded-2xl glass-panel glass-panel-hover cursor-pointer border border-white/5 space-y-3 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-0.5 rounded-full capitalize">
                        {post.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-semibold">
                        <Clock size={11} />
                        <span>{formatPostTime(post.createdAt)}</span>
                      </div>
                    </div>

                    <h3 className="font-extrabold text-white text-base leading-snug">{post.title}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{post.content}</p>

                    <div className="flex items-center gap-6 pt-3 border-t border-white/5 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <User size={13} />
                        <span>{post.authorName}</span>
                      </div>
                      
                      <button
                        onClick={(e) => handleLikePost(e, post.id)}
                        className={`flex items-center gap-1.5 transition-colors ${post.isLikedByUser ? 'text-brand-accent font-bold' : 'text-gray-500 hover:text-white'}`}
                      >
                        <ThumbsUp size={13} className={post.isLikedByUser ? 'fill-brand-accent' : ''} />
                        <span>{post.likesCount}</span>
                      </button>

                      <div className="flex items-center gap-1.5 text-gray-500">
                        <MessageSquare size={13} />
                        <span>{post.commentsCount} comments</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 glass-panel rounded-2xl text-center space-y-2 text-gray-500">
                  <MessageCircle size={36} className="mx-auto text-gray-600 animate-pulse" />
                  <p className="text-sm">No discussions found in this domain yet.</p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Selected Post detail display overlay drawer/modal */}
      <AnimatePresence>
        {selectedPost && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="fixed inset-0 bg-black z-40"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-10 bottom-10 md:inset-x-1/4 bg-[#0D111E] border border-white/10 rounded-2xl p-6 z-50 flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="text-xs text-brand-primary font-bold">{selectedPost.category}</span>
                <button onClick={() => setSelectedPost(null)} className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              {/* Main content body */}
              <div className="flex-1 overflow-y-auto py-4 space-y-6">
                
                {/* Original Post */}
                <div className="space-y-3">
                  <h2 className="text-xl font-extrabold text-white leading-tight">{selectedPost.title}</h2>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="font-semibold text-gray-400">{selectedPost.authorName}</span>
                    <span>•</span>
                    <span>{formatPostTime(selectedPost.createdAt)}</span>
                  </div>

                  <p className="text-xs md:text-sm text-gray-300 leading-relaxed whitespace-pre-wrap pt-2 bg-white/5 p-4 rounded-xl border border-white/5">
                    {selectedPost.content}
                  </p>

                  <div className="flex items-center gap-4 pt-1">
                    <button
                      onClick={(e) => handleLikePost(e, selectedPost.id)}
                      className={`flex items-center gap-1.5 text-xs ${selectedPost.isLikedByUser ? 'text-brand-accent font-bold' : 'text-gray-500 hover:text-white'}`}
                    >
                      <ThumbsUp size={13} className={selectedPost.isLikedByUser ? 'fill-brand-accent' : ''} />
                      <span>{selectedPost.likesCount} Likes</span>
                    </button>
                  </div>
                </div>

                {/* Comment history list */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Comments ({selectedPost.commentsCount})</h4>
                  <div className="space-y-3.5">
                    {selectedPost.comments.length > 0 ? (
                      selectedPost.comments.map((comment: any) => (
                        <div key={comment.id} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1.5">
                          <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
                            <span className="text-gray-400">{comment.authorName}</span>
                            <span>{formatPostTime(comment.createdAt)}</span>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 italic pl-1">No comments posted yet.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Action comment box footer */}
              <form onSubmit={handleAddComment} className="pt-4 border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Post a comment/response to this query..."
                  className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs"
                />
                <button
                  type="submit"
                  disabled={!commentContent.trim()}
                  className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Comment
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Thread dialog modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 bg-black z-40"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-20 max-w-lg mx-auto bg-[#0D111E] border border-white/10 rounded-2xl p-6 z-50 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h3 className="font-bold text-white">Create New Discussion Thread</h3>
                <button onClick={() => setShowCreateModal(false)} className="p-1 text-gray-400 hover:text-white rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">Thread Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="E.g., TCS NQT Quantitative section sample patterns"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400">Category Tag</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white focus:outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c} className="bg-[#0D111E]">{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">Detailed Message</label>
                  <textarea
                    required
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Provide questions descriptions, screenshots links, or topics breakdown..."
                    rows={6}
                    className="w-full p-3 rounded-xl glass-input text-xs resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-xl hover:shadow-lg transition-all text-xs"
                >
                  Publish Discussion Thread
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
