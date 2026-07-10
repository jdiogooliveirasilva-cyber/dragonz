import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Post } from '../types';
import PostCard from '../components/PostCard';
import PostEditor from '../components/PostEditor';
import toast from 'react-hot-toast';

export default function FeedPage() {
  const { user, isAdmin } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [hasMore, setHasMore] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['posts', page, selectedCategory],
    queryFn: () => postsApi.getAll({ page, limit: 20, categoryId: selectedCategory || undefined }).then(r => r.data.data),
  });

  useEffect(() => {
    if (data) {
      if (page === 1) {
        setAllPosts(data.posts);
      } else {
        setAllPosts(prev => {
          const existingIds = new Set(prev.map((p: Post) => p.id));
          const newPosts = data.posts.filter((p: Post) => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
      }
      setHasMore(data.pagination.page < data.pagination.totalPages);
    }
  }, [data, page]);

  useEffect(() => {
    setPage(1);
    setAllPosts([]);
  }, [selectedCategory]);

  // Socket.IO real-time updates
  useEffect(() => {
    if (!socket) return;
    socket.on('new_post', (post: Post) => {
      setAllPosts(prev => {
        if (prev.find(p => p.id === post.id)) return prev;
        if (post.isPinned) return [post, ...prev];
        const pinned = prev.filter(p => p.isPinned);
        const rest = prev.filter(p => !p.isPinned);
        return [...pinned, post, ...rest];
      });
    });
    socket.on('post_updated', (updated: Post) => {
      setAllPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
    });
    socket.on('post_deleted', (postId: string) => {
      setAllPosts(prev => prev.filter(p => p.id !== postId));
    });
    socket.on('like_update', ({ postId, likesCount }: { postId: string; likesCount: number }) => {
      setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, likesCount } : p));
    });
    socket.on('comment_count_update', ({ postId, action }: { postId: string; action: string }) => {
      setAllPosts(prev => prev.map(p => p.id === postId
        ? { ...p, commentsCount: action === 'add' ? p.commentsCount + 1 : Math.max(0, p.commentsCount - 1) }
        : p
      ));
    });
    return () => {
      socket.off('new_post');
      socket.off('post_updated');
      socket.off('post_deleted');
      socket.off('like_update');
      socket.off('comment_count_update');
    };
  }, [socket]);

  const handleCreate = async (formData: any) => {
    setCreating(true);
    try {
      await postsApi.create(formData);
      setShowEditor(false);
      toast.success('Postagem criada!');
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar postagem.');
    } finally { setCreating(false); }
  };

  const handleUpdate = async (formData: any) => {
    if (!editingPost) return;
    setCreating(true);
    try {
      const { data } = await postsApi.update(editingPost.id, formData);
      setAllPosts(prev => prev.map(p => p.id === editingPost.id ? data.data : p));
      setEditingPost(null);
      setShowEditor(false);
      toast.success('Postagem atualizada!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar.');
    } finally { setCreating(false); }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Excluir esta postagem?')) return;
    try {
      await postsApi.delete(postId);
      setAllPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Postagem excluída.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir.');
    }
  };

  const handleTogglePin = async (postId: string) => {
    try {
      const { data } = await postsApi.togglePin(postId);
      setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, isPinned: data.data.isPinned } : p));
      toast.success(data.data.isPinned ? 'Postagem fixada.' : 'Postagem desafixada.');
    } catch { toast.error('Erro ao fixar postagem.'); }
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setShowEditor(true);
  };

  return (
    <div className="space-y-4">
      {/* Welcome banner */}
      {!user && (
        <div className="card p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
          <h2 className="text-xl font-bold mb-1">Bem-vindo ao PostHub!</h2>
          <p className="text-indigo-100 text-sm">Faça login para curtir, comentar e interagir com as postagens.</p>
        </div>
      )}

      {/* Admin create button */}
      {isAdmin && !showEditor && (
        <button onClick={() => { setEditingPost(null); setShowEditor(true); }}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nova Postagem
        </button>
      )}

      {/* Post editor */}
      {showEditor && (
        <div className="card p-6 animate-slide-up">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingPost ? 'Editar Postagem' : 'Nova Postagem'}
          </h3>
          <PostEditor
            post={editingPost || undefined}
            onSubmit={editingPost ? handleUpdate : handleCreate}
            onCancel={() => { setShowEditor(false); setEditingPost(null); }}
            loading={creating}
          />
        </div>
      )}

      {/* Posts feed */}
      {isLoading && page === 1 ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" /><div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-20" /></div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
              <div className="space-y-2"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded" /><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-5/6" /></div>
            </div>
          ))}
        </div>
      ) : allPosts.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">Nenhuma postagem ainda.</p>
          {isAdmin && <p className="text-sm text-gray-400 mt-2">Crie a primeira postagem!</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {allPosts.map(post => (
            <PostCard key={post.id} post={post}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onTogglePin={handleTogglePin}
              onLikeChange={(postId, liked, count) => setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: liked, likesCount: count } : p))}
            />
          ))}

          {hasMore && (
            <div className="text-center pt-2">
              <button onClick={() => setPage(p => p + 1)} disabled={isLoading}
                className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-full text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
                {isLoading ? 'Carregando...' : 'Carregar mais'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
