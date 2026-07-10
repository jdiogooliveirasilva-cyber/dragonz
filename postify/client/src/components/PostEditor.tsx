import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { postsApi } from '../services/api';
import { Category, Post } from '../types';
import toast from 'react-hot-toast';

interface Props {
  post?: Post;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function PostEditor({ post, onSubmit, onCancel, loading = false }: Props) {
  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'SCHEDULED'>(post?.status || 'PUBLISHED');
  const [isPinned, setIsPinned] = useState(post?.isPinned || false);
  const [categoryId, setCategoryId] = useState(post?.category?.id || '');
  const [tags, setTags] = useState(post?.tags?.map(t => t.name).join(', ') || '');
  const [imageUrls, setImageUrls] = useState(post?.imageUrls?.join('\n') || '');
  const [videoUrls, setVideoUrls] = useState(post?.videoUrls?.join('\n') || '');
  const [publishAt, setPublishAt] = useState(post?.publishAt ? new Date(post.publishAt).toISOString().slice(0, 16) : '');

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => postsApi.getCategories().then(r => r.data.data as Category[]),
    staleTime: 60000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Título é obrigatório.'); return; }
    if (!content.trim()) { toast.error('Conteúdo é obrigatório.'); return; }

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    const imageList = imageUrls.split('\n').map(u => u.trim()).filter(Boolean);
    const videoList = videoUrls.split('\n').map(u => u.trim()).filter(Boolean);

    await onSubmit({
      title: title.trim(),
      content,
      excerpt: excerpt.trim() || undefined,
      status,
      isPinned,
      categoryId: categoryId || undefined,
      tags: tagList,
      imageUrls: imageList,
      videoUrls: videoList,
      publishAt: status === 'SCHEDULED' && publishAt ? publishAt : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título *</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Título da postagem" className="input" maxLength={200} required />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conteúdo *</label>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="Escreva o conteúdo da postagem (HTML é suportado)..."
          className="input min-h-48 resize-y" required />
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resumo (opcional)</label>
        <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)}
          placeholder="Resumo exibido no feed..." className="input h-20 resize-none" maxLength={500} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value as any)} className="input">
            <option value="DRAFT">Rascunho</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="SCHEDULED">Agendado</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="input">
            <option value="">Sem categoria</option>
            {categoriesData?.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Scheduled date */}
      {status === 'SCHEDULED' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de publicação</label>
          <input type="datetime-local" value={publishAt} onChange={e => setPublishAt(e.target.value)} className="input" />
        </div>
      )}

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (separadas por vírgula)</label>
        <input type="text" value={tags} onChange={e => setTags(e.target.value)}
          placeholder="tecnologia, react, javascript" className="input" />
      </div>

      {/* Image URLs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URLs de Imagens (uma por linha)</label>
        <textarea value={imageUrls} onChange={e => setImageUrls(e.target.value)}
          placeholder="https://exemplo.com/imagem.jpg" className="input h-20 resize-none" />
      </div>

      {/* Video URLs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URLs de Vídeos (uma por linha)</label>
        <textarea value={videoUrls} onChange={e => setVideoUrls(e.target.value)}
          placeholder="https://youtube.com/watch?v=..." className="input h-20 resize-none" />
      </div>

      {/* Pin */}
      <div className="flex items-center gap-2">
        <input type="checkbox" id="isPinned" checked={isPinned} onChange={e => setIsPinned(e.target.checked)}
          className="w-4 h-4 text-indigo-600 rounded" />
        <label htmlFor="isPinned" className="text-sm text-gray-700 dark:text-gray-300">Fixar postagem no topo</label>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {post ? 'Salvar Alterações' : 'Publicar'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  );
}
