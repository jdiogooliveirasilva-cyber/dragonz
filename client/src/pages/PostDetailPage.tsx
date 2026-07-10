import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { postsApi, usersApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Post } from '../types';
import UserAvatar from '../components/UserAvatar';
import CommentSection from '../components/CommentSection';
import PostEditor from '../components/PostEditor';
import toast from 'react-hot-toast';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { socket } = useSocket();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [liking, setLiking] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['post', id],
    queryFn: () => postsApi.getById(id!).then(r => r.data.data as Post),
    enabled: !!id,
  });

  useEffect(() => {
    if (data) {
      setLiked(data.isLiked);
      setLikesCount(data.likesCount);
    }
  }, [data]);

  useEffect(() => {
    if (!socket || !id) return;
    socket.on('like_update', ({ postId, likesCount: count }: { postId: string; likesCount: number }) => {
      if (postId === id) setLikesCount(count);
    });
    socket.on('post_updated', (updated: Post) => {
      if (updated.id === id) refetch();
    });
    socket.on('post_deleted', (postId: string) => {
      if (postId === id) { navigate('/'); toast.error('Esta postagem foi excluída.'); }
    });
    return () => {
      socket.off('like_update');
      socket.off('post_updated');
      socket.off('post_deleted');
    };
  }, [socket, id, navigate, refetch]);

  const handleLike = async () => {
    if (!user) { toast.error('Faça login para curtir.'); return; }
    if (liking) return;
    setLiking(true);
    try {
      const { data: res } = await usersApi.toggleLike(id!);
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch { toast.error('Erro ao curtir.'); }
    finally { setLiking(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Excluir esta postagem permanentemente?')) return;
    try {
      await postsApi.delete(id!);
      navigate('/');
      toast.success('Postagem excluída.');
    } catch { toast.error('Erro ao excluir.'); }
  };

  const handleUpdate = async (formData: any) => {
    setSaving(true);
    try {
      await postsApi.update(id!, formData);
      setEditing(false);
      refetch();
      toast.success('Postagem atualizada!');
    } catch { toast.error('Erro ao atualizar.'); }
    finally { setSaving(false); }
  };

  if (isLoading) return (
    <div className="card p-8 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
      <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-4 bg-gray-100 dark:bg-gray-800 rounded" />)}</div>
    </div>
  );

  if (error || !data) return (
    <div className="card p-8 text-center">
      <p className="text-gray-500 dark:text-gray-400">Postagem não encontrada.</p>
      <button onClick={() => navigate('/')} className="mt-4 btn-primary text-sm">Voltar ao início</button>
    </div>
  );

  const canManage = isAdmin || user?.id === data.author.id;

  if (editing) {
    return (
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Editar Postagem</h2>
        <PostEditor post={data} onSubmit={handleUpdate} onCancel={() => setEditing(false)} loading={saving} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Início</Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <span className="text-gray-900 dark:text-white truncate">{data.title}</span>
      </div>

      <article className="card p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={`/profile/${data.author.id}`}>
              <UserAvatar name={data.author.name} avatar={data.author.avatar} size="md" role={data.author.role} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link to={`/profile/${data.author.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  {data.author.name}
                </Link>
                {(data.author.role === 'OWNER' || data.author.role === 'ADMIN') && (
                  <span className={data.author.role === 'OWNER' ? 'badge-owner' : 'badge-admin'}>
                    {data.author.role === 'OWNER' ? 'Dono' : 'Admin'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <span>{format(new Date(data.createdAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                {data.category && (
                  <>
                    <span>·</span>
                    <Link to={`/search?categoryId=${data.category.id}`} className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.category.color }} />
                      {data.category.name}
                    </Link>
                  </>
                )}
                <span>·</span>
                <span>{data.viewCount} visualizações</span>
              </div>
            </div>
          </div>

          {canManage && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setEditing(true)}
                className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button onClick={handleDelete}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          )}
        </div>

        {/* Title */}
        {data.isPinned && (
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-3">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 100-16 8 8 0 000 16z"/></svg>
            Fixado
          </div>
        )}
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-6">{data.title}</h1>

        {/* Content */}
        <div className="prose-custom" dangerouslySetInnerHTML={{ __html: data.content }} />

        {/* Images */}
        {data.imageUrls?.length > 0 && (
          <div className="mt-6 grid gap-3 grid-cols-1 sm:grid-cols-2">
            {data.imageUrls.map((url, i) => (
              <img key={i} src={url} alt={`Imagem ${i + 1}`} className="rounded-xl w-full object-cover max-h-96 cursor-pointer"
                onClick={() => window.open(url, '_blank')} />
            ))}
          </div>
        )}

        {/* Videos */}
        {data.videoUrls?.length > 0 && (
          <div className="mt-6 space-y-4">
            {data.videoUrls.map((url, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                {url.includes('youtube.com') || url.includes('youtu.be') ? (
                  <iframe src={url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                    className="w-full h-64 sm:h-80" allowFullScreen title={`Video ${i + 1}`} />
                ) : (
                  <video src={url} controls className="w-full max-h-80 rounded-xl" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {data.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            {data.tags.map(tag => (
              <Link key={tag.id} to={`/search?tag=${tag.slug}`}
                className="text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Like and stats bar */}
        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button onClick={handleLike} disabled={liking}
            className={`flex items-center gap-2 text-sm font-medium transition-all ${liked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'}`}>
            <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{likesCount} curtida{likesCount !== 1 ? 's' : ''}</span>
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <span>{data.commentsCount} comentário{data.commentsCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </article>

      {/* Comments */}
      <div className="card p-6">
        <CommentSection postId={id!} />
      </div>
    </div>
  );
}
