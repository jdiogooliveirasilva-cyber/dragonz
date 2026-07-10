import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usersApi, adminApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import UserAvatar from '../components/UserAvatar';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const { user: currentUser, isOwner } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter],
    queryFn: () => usersApi.getAll({ page, limit: 20, search: search || undefined, role: roleFilter || undefined }).then(r => r.data.data),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleBan = async (userId: string, name: string) => {
    if (!confirm(`Banir ${name}?`)) return;
    try {
      await adminApi.banUser(userId);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`${name} foi banido.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao banir usuário.');
    }
  };

  const handleUnban = async (userId: string, name: string) => {
    try {
      await adminApi.unbanUser(userId);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`${name} foi desbanido.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao desbanir.');
    }
  };

  const handleSetRole = async (userId: string, name: string, role: string) => {
    if (!confirm(`Definir cargo de ${name} como ${role}?`)) return;
    try {
      await adminApi.setRole(userId, role);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`Cargo de ${name} atualizado.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar cargo.');
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`EXCLUIR permanentemente a conta de ${name}? Esta ação não pode ser desfeita.`)) return;
    try {
      await adminApi.deleteUser(userId);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`Conta de ${name} excluída.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir.');
    }
  };

  const roleLabels: Record<string, string> = { OWNER: 'Dono', ADMIN: 'Admin', USER: 'Membro', BANNED: 'Banido' };
  const roleBadge: Record<string, string> = { OWNER: 'badge-owner', ADMIN: 'badge-admin', USER: 'badge-user', BANNED: 'badge-banned' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Usuários</h1>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input type="search" value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Pesquisar por nome ou e-mail..." className="input flex-1 text-sm" />
          <button type="submit" className="btn-primary text-sm px-4">Buscar</button>
        </form>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="input text-sm w-full sm:w-40">
          <option value="">Todos os cargos</option>
          <option value="OWNER">Dono</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">Membro</option>
          <option value="BANNED">Banido</option>
        </select>
      </div>

      {/* Users table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : !data?.users?.length ? (
          <div className="p-8 text-center text-gray-400 dark:text-gray-500">Nenhum usuário encontrado.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Usuário</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Cargo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Membro desde</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden xl:table-cell">Atividade</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.users.map((u: User & { commentsCount: number; likesCount: number }) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/profile/${u.id}`} className="flex items-center gap-3 min-w-0">
                          <UserAvatar name={u.name} avatar={u.avatar} size="sm" role={u.role} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32">{u.name}</p>
                            <p className="text-xs text-gray-400 truncate max-w-32">{u.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={roleBadge[u.role]}>{roleLabels[u.role]}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(u.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span title="Comentários">{u.commentsCount} cmt</span>
                          <span title="Curtidas">{u.likesCount} ❤</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.id !== currentUser?.id && u.role !== 'OWNER' && (
                          <div className="flex items-center justify-end gap-1">
                            {u.role === 'BANNED' ? (
                              <button onClick={() => handleUnban(u.id, u.name)}
                                className="px-2.5 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors font-medium">
                                Desbanir
                              </button>
                            ) : (
                              <button onClick={() => handleBan(u.id, u.name)}
                                className="px-2.5 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors font-medium">
                                Banir
                              </button>
                            )}
                            {isOwner && u.role !== 'BANNED' && (
                              <>
                                {u.role === 'USER' ? (
                                  <button onClick={() => handleSetRole(u.id, u.name, 'ADMIN')}
                                    className="px-2.5 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 transition-colors font-medium">
                                    +Admin
                                  </button>
                                ) : u.role === 'ADMIN' ? (
                                  <button onClick={() => handleSetRole(u.id, u.name, 'USER')}
                                    className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium">
                                    -Admin
                                  </button>
                                ) : null}
                                <button onClick={() => handleDelete(u.id, u.name)}
                                  className="px-2.5 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium">
                                  Excluir
                                </button>
                              </>
                            )}
                          </div>
                        )}
                        {u.id === currentUser?.id && (
                          <span className="text-xs text-gray-400 italic">Você</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {data.pagination.total} usuário{data.pagination.total !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800">
                    Anterior
                  </button>
                  <span className="text-xs text-gray-500">{page}/{data.pagination.totalPages}</span>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.totalPages}
                    className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800">
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
