import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { postsApi } from '../services/api';
import { Post } from '../types';
import PostCard from '../components/PostCard';
import toast from 'react-hot-toast';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(1);

  const queryParams = {
    search: searchParams.get('q') || undefined,
    categoryId: searchParams.get('categoryId') || undefined,
    tag: searchParams.get('tag') || undefined,
    page,
    limit: 20,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['search', searchParams.toString(), page],
    queryFn: () => postsApi.getAll(queryParams).then(r => r.data.data),
    enabled: !!(queryParams.search || queryParams.categoryId || queryParams.tag),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchParams(search ? { q: search } : {});
  };

  const hasFilters = !!(queryParams.search || queryParams.categoryId || queryParams.tag);

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Pesquisar Postagens</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar por título, autor ou conteúdo..."
            className="input flex-1" autoFocus />
          <button type="submit" className="btn-primary px-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>

        {queryParams.categoryId && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Filtrando por categoria</span>
            <button onClick={() => { setSearchParams({}); setPage(1); }}
              className="text-xs text-red-500 hover:underline">Limpar filtro</button>
          </div>
        )}
        {queryParams.tag && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Tag: <strong>#{queryParams.tag}</strong></span>
            <button onClick={() => { setSearchParams({}); setPage(1); }}
              className="text-xs text-red-500 hover:underline">Limpar filtro</button>
          </div>
        )}
      </div>

      {!hasFilters ? (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">Digite algo para pesquisar.</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : !data?.posts?.length ? (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">Nenhuma postagem encontrada.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {data.pagination.total} resultado{data.pagination.total !== 1 ? 's' : ''} encontrado{data.pagination.total !== 1 ? 's' : ''}
          </p>
          <div className="space-y-4">
            {data.posts.map((post: Post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800">
                Anterior
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {page} / {data.pagination.totalPages}
              </span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.totalPages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800">
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
