import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Post } from '../types';
import UserAvatar from './UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { usersApi } from '../services/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
  post: Post;
  onLikeChange?: (postId: string, liked: boolean, count: number) => void;
  onDelete?: (postId: string) => void;
  onEdit?: (post: Post) => void;
  onTogglePin?: (postId: string) => void;
}

export default function PostCard({ post, onLikeChange, onDelete, onEdit, onTogglePin }: Props) {
  const { user, isAdmin } = useAuth();
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [liking, setLiking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Faça login para curtir.'); return; }
    if (liking) return;
    setLiking(true);
    try {
      const { data } = await usersApi.toggleLike(post.id);
      setLiked(data.data.liked);
      setLikesCount(data.data.likesCount);
      onLikeChange?.(post.id, data.data.liked, data.data.likesCount);
    } catch {
      toast.error('Erro ao curtir.');
    } finally {
      setLiking(false);
    }
  };

  const canManage = isAdmin || user?.id === post.author.id;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR });

  return (
    <article className="card p-5 hover:shadow-md transition-shadow animate-fade-in">
      {/* Pinned badge */}
      {post.isPinned && (
        <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-3">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 100-16 8 8 0 000 16z"/></svg>
          Fixado
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Link to={`/profile/${post.author.id}`} className="flex-shrink-0">
            <UserAvatar name={post.author.name} avatar={post.author.avatar} size="md" role={post.author.role} />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/profile/${post.author.id}`} className="font-semibold text-gray-900 dark:text-white text-sm hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {post.author.name}
              </Link>
              {(post.author.role === 'OWNER' || post.author.role === 'ADMIN') && (
                <span className={post.author.role === 'OWNER' ? 'badge-owner' : 'badge-admin'}>
                  {post.author.role === 'OWNER' ? 'Dono' : 'Admin'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              <span>{timeAgo}</span>
              {post.category && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: post.category.color }} />
                    {post.category.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {canManage && (
          <div className="relative flex-shrink-0">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-44 card shadow-lg z-20 py-1 animate-slide-up">
                  <button onClick={() => { onEdit?.(post); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Editar
                  </button>
                  {isAdmin && (
                    <button onClick={() => { onTogglePin?.(post.id); setMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                      {post.isPinned ? 'Desafixar' : 'Fixar'}
                    </button>
                  )}
                  <button onClick={() => { onDelete?.(post.id); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <Link to={`/post/${post.id}`} className="block mt-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
        )}
        {post.imageUrls?.[0] && (
          <img src={post.imageUrls[0]} alt={post.title} className="mt-3 w-full h-48 object-cover rounded-lg" />
        )}
      </Link>

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {post.tags.map(tag => (
            <Link key={tag.id} to={`/search?tag=${tag.slug}`}
              className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              #{tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <button onClick={handleLike} disabled={liking}
          className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'}`}>
          <svg className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{likesCount}</span>
        </button>

        <Link to={`/post/${post.id}#comments`} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <span>{post.commentsCount}</span>
        </Link>

        <div className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 ml-auto">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          <span>{post.viewCount}</span>
        </div>
      </div>
    </article>
  );
}
