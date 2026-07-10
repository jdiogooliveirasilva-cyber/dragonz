import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Comment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { commentsApi } from '../services/api';
import UserAvatar from './UserAvatar';
import toast from 'react-hot-toast';

interface Props {
  comment: Comment;
  postId: string;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
  onReply: (parentId: string, authorName: string) => void;
  onPin: (id: string) => void;
  onLikeChange: (id: string, liked: boolean, count: number) => void;
}

export default function CommentItem({ comment, postId, onDelete, onUpdate, onReply, onPin, onLikeChange }: Props) {
  const { user, isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [liked, setLiked] = useState(comment.isLiked);
  const [likesCount, setLikesCount] = useState(comment.likesCount);
  const [showReplies, setShowReplies] = useState(false);
  const [saving, setSaving] = useState(false);
  const [liking, setLiking] = useState(false);

  const canManage = isAdmin || user?.id === comment.author.id;
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ptBR });

  const handleLike = async () => {
    if (!user) { toast.error('Faça login para curtir.'); return; }
    if (liking) return;
    setLiking(true);
    try {
      const { data } = await commentsApi.toggleLike(postId, comment.id);
      setLiked(data.data.liked);
      setLikesCount(data.data.likesCount);
      onLikeChange(comment.id, data.data.liked, data.data.likesCount);
    } catch { toast.error('Erro ao curtir.'); }
    finally { setLiking(false); }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) { toast.error('Comentário não pode estar vazio.'); return; }
    setSaving(true);
    try {
      await commentsApi.update(postId, comment.id, editContent);
      onUpdate(comment.id, editContent);
      setEditing(false);
      toast.success('Comentário atualizado.');
    } catch { toast.error('Erro ao atualizar comentário.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Excluir este comentário?')) return;
    try {
      await commentsApi.delete(postId, comment.id);
      onDelete(comment.id);
      toast.success('Comentário excluído.');
    } catch { toast.error('Erro ao excluir.'); }
  };

  return (
    <div className={`flex gap-3 animate-fade-in ${comment.parentId ? 'ml-10' : ''}`}>
      <UserAvatar name={comment.author.name} avatar={comment.author.avatar} size="sm" role={comment.author.role} className="flex-shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        <div className={`bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 ${comment.isPinned ? 'ring-1 ring-indigo-500' : ''}`}>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">{comment.author.name}</span>
            {(comment.author.role === 'OWNER' || comment.author.role === 'ADMIN') && (
              <span className={comment.author.role === 'OWNER' ? 'badge-owner' : 'badge-admin'}>
                {comment.author.role === 'OWNER' ? 'Dono' : 'Admin'}
              </span>
            )}
            {comment.isPinned && (
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">📌 Fixado</span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{timeAgo}</span>
          </div>

          {editing ? (
            <div className="mt-2">
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                className="input text-sm resize-none" rows={3} autoFocus />
              <div className="flex gap-2 mt-2">
                <button onClick={handleSaveEdit} disabled={saving}
                  className="text-xs btn-primary py-1 px-3">
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button onClick={() => { setEditing(false); setEditContent(comment.content); }}
                  className="text-xs px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">{comment.content}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-1.5 px-2">
          <button onClick={handleLike} disabled={liking}
            className={`flex items-center gap-1 text-xs transition-colors ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
            <svg className="w-3.5 h-3.5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {likesCount > 0 && <span>{likesCount}</span>}
          </button>

          {user && (
            <button onClick={() => onReply(comment.id, comment.author.name)}
              className="text-xs text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium">
              Responder
            </button>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <button onClick={() => setShowReplies(!showReplies)}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              {showReplies ? 'Ocultar' : `Ver ${comment.replies.length} resposta${comment.replies.length > 1 ? 's' : ''}`}
            </button>
          )}

          {canManage && (
            <>
              <button onClick={() => setEditing(true)}
                className="text-xs text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Editar
              </button>
              <button onClick={handleDelete}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                Excluir
              </button>
            </>
          )}

          {isAdmin && (
            <button onClick={() => onPin(comment.id)}
              className="text-xs text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {comment.isPinned ? 'Desafixar' : 'Fixar'}
            </button>
          )}
        </div>

        {/* Replies */}
        {showReplies && comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} postId={postId}
                onDelete={onDelete} onUpdate={onUpdate} onReply={onReply} onPin={onPin} onLikeChange={onLikeChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
