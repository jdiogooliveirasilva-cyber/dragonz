import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { adminApi } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { DashboardStats } from '../types';
import StatsCards from '../components/admin/StatsCards';
import Charts from '../components/admin/Charts';
import UserAvatar from '../components/UserAvatar';

export default function AdminDashboardPage() {
  const { onlineCount } = useSocket();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard().then(r => r.data.data as DashboardStats),
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7].map(i => <div key={i} className="card h-20" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card h-64" />
          <div className="card h-64" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const stats = { ...data.stats, onlineUsers: onlineCount || data.stats.onlineUsers };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Painel Administrativo</h1>
        <button onClick={() => refetch()} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Atualizar
        </button>
      </div>

      {/* Stats cards */}
      <StatsCards stats={stats} />

      {/* Charts */}
      <Charts postsPerDay={data.charts.postsPerDay} usersPerDay={data.charts.usersPerDay} />

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent posts */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Postagens Recentes</h3>
            <Link to="/" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Ver todas</Link>
          </div>
          <div className="space-y-3">
            {data.recentPosts.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Nenhuma postagem ainda.</p>
            ) : data.recentPosts.map(post => (
              <Link key={post.id} to={`/post/${post.id}`}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{post.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400">{post.author?.name}</span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(post.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    {(post as any).likesCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    {(post as any).commentsCount || 0}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent users */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Usuários Recentes</h3>
            <Link to="/admin/users" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-3">
            {data.recentUsers.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Nenhum usuário ainda.</p>
            ) : data.recentUsers.map(user => (
              <Link key={user.id} to={`/profile/${user.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <UserAvatar name={user.name} avatar={user.avatar} size="sm" role={user.role} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className={
                    user.role === 'OWNER' ? 'badge-owner' :
                    user.role === 'ADMIN' ? 'badge-admin' :
                    user.role === 'BANNED' ? 'badge-banned' : 'badge-user'
                  }>
                    {user.role === 'OWNER' ? 'Dono' : user.role === 'ADMIN' ? 'Admin' : user.role === 'BANNED' ? 'Banido' : 'Membro'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors text-center">
            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Nova Postagem</span>
          </Link>
          <Link to="/admin/users" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-center">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Gerenciar Usuários</span>
          </Link>
          <Link to="/admin/settings" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-center">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-xs font-medium text-green-700 dark:text-green-300">Configurações</span>
          </Link>
          <Link to="/search" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-center">
            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Pesquisar</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
