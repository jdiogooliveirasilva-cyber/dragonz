import { useState, useEffect, useCallback } from 'react';
import { Comment } from '../types';
import { commentsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import CommentItem from './CommentItem';
import toast from 'react-hot-toast';

interface Props { postId: string; }

export default function CommentSection({ postId }: Props) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const { data } = await commentsApi.getByPost(postId);
      setComments(data.data);
    } catch { toast.error('Erro ao carregar comentários.'); }
    finally { setLoading(false); }
  }, [postId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_post', postId);

    socket.on('new_comment', (comment: Comment) => {
      setComments(prev => {
        if (comment.parentId) {
          return prev.map(c => {
            if (c.id === comment.parentId) {
              return { ...c, replies: [...(c.replies || []), comment], repliesCount: (c.repliesCount || 0) + 1 };
            }
            return c;
          });
        }
        if (prev.find(c => c.id === comment.id)) return prev;
        return [...prev, comment];
      });
    });

    socket.on('comment_updated', (updated: Comment) => {
      setComments(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
    });

    socket.on('comment_deleted', (commentId: string) => {
      setComments(prev => {
        const filtered = prev.filter(c => c.id !== commentId);
        return filtered.map(c => ({
          ...c,
          replies: c.replies?.filter(r => r.id !== commentId) || [],
        }));
      });
    });

    socket.on('comment_like_update', ({ commentId, likesCount }: { commentId: string; likesCount: number }) => {
      setComments(prev => prev.map(c => {
        if (c.id === commentId) return { ...c, likesCount };
        return { ...c, replies: c.replies?.map(r => r.id === commentId ? { ...r, likesCount } : r) };
      }));
    });

    return () => {
      socket.emit('leave_post', postId);
      socket.off('new_comment');
      socket.off('comment_updated');
      socket.off('comment_deleted');
      socket.off('comment_like_update');
    };
  }, [socket, postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) { toast.error('Faça login para comentar.'); return; }
    setSubmitting(true);
    try {
      await commentsApi.create(postId, { content: newComment.trim(), parentId: replyTo?.id });
      setNewComment('');
      setReplyTo(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao comentar.');
    } finally { setSubmitting(false); }
  };

  const handleDelete = (id: string) => {
    setComments(prev => {
      const filtered = prev.filter(c => c.id !== id);
      return filtered.map(c => ({
        ...c,
        replies: c.replies?.filter(r => r.id !== id) || [],
      }));
    });
  };

  const handleUpdate = (id: string, content: string) => {
    setComments(prev => prev.map(c => {
      if (c.id === id) return { ...c, content };
      return { ...c, replies: c.replies?.map(r => r.id === id ? { ...r, content } : r) };
    }));
  };

  const handlePin = async (id: string) => {
    try {
      const { data } = await commentsApi.togglePin(postId, id);
      setComments(prev => prev.map(c => c.id === id ? { ...c, isPinned: data.data.isPinned } : c));
    } catch { toast.error('Erro ao fixar comentário.'); }
  };

  const handleLikeChange = (id: string, liked: boolean, count: number) => {
    setComments(prev => prev.map(c => {
      if (c.id === id) return { ...c, isLiked: liked, likesCount: count };
      return { ...c, replies: c.replies?.map(r => r.id === id ? { ...r, isLiked: liked, likesCount: count } : r) };
    }));
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div id="comments" className="mt-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Comentários {comments.length > 0 && <span className="text-gray-400 dark:text-gray-500 font-normal">({comments.length})</span>}
      </h3>

      {/* New comment form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 text-sm text-indigo-600 dark:text-indigo-400">
              <span>Respondendo a <strong>{replyTo.name}</strong></span>
              <button type="button" onClick={() => setReplyTo(null)} className="hover:text-red-500 transition-colors">✕</button>
            </div>
          )}
          <div className="flex gap-3">
            <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
              placeholder={replyTo ? `Respondendo para ${replyTo.name}...` : 'Escreva um comentário...'}
              className="input flex-1 resize-none h-20" maxLength={2000} />
          </div>
          <div className="flex justify-end mt-2">
            <button type="submit" disabled={submitting || !newComment.trim()} className="btn-primary text-sm py-1.5 px-4">
              {submitting ? 'Enviando...' : replyTo ? 'Responder' : 'Comentar'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <a href="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Faça login</a> para comentar.
          </p>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl h-16" />
            </div>
          ))}
        </div>
      ) : sortedComments.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <p className="text-sm">Seja o primeiro a comentar!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedComments.map(comment => (
            <CommentItem key={comment.id} comment={comment} postId={postId}
              onDelete={handleDelete} onUpdate={handleUpdate}
              onReply={(parentId, name) => setReplyTo({ id: parentId, name })}
              onPin={handlePin} onLikeChange={handleLikeChange} />
          ))}
        </div>
      )}
    </div>
  );
}
