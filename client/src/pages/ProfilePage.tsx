import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usersApi, postsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Post, User } from '../types';
import UserAvatar from '../components/UserAvatar';
import PostCard from '../components/PostCard';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, updateUser } = useAuth();
  const isOwn = currentUser?.id === id;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'settings'>('posts');

  const { data: profileData, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => usersApi.getById(id!).then(r => r.data.data as User),
    enabled: !!id,
  });

  useEffect(() => {
    if (profileData) {
      setName(profileData.name);
      setBio(profileData.bio || '');
    }
  }, [profileData]);

  const { data: postsData } = useQuery({
    queryKey: ['user-posts', id],
    queryFn: () => postsApi.getAll({ authorId: id, limit: 50 }).then(r => r.data.data),
    enabled: !!id,
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const form = new FormData();
      if (name) form.append('name', name);
      if (bio !== undefined) form.append('bio', bio);
      if (avatarFile) form.append('avatar', avatarFile);
      const { data } = await usersApi.updateProfile(form);
      updateUser({ ...currentUser!, ...data.data });
      refetchProfile();
      setEditing(false);
      setAvatarFile(null);
      toast.success('Perfil atualizado!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar perfil.');
    } finally { setSavingProfile(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Nova senha deve ter no mínimo 6 caracteres.'); return; }
    setSavingPassword(true);
    try {
      await usersApi.changePassword({ currentPassword, newPassword });
      toast.success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao alterar senha.');
    } finally { setSavingPassword(false); }
  };

  if (!profileData) {
    return (
      <div className="card p-8 animate-pulse">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" /><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-20" /></div>
        </div>
      </div>
    );
  }

  const roleLabels: Record<string, string> = { OWNER: 'Dono', ADMIN: 'Administrador', USER: 'Membro', BANNED: 'Banido' };
  const roleBadge: Record<string, string> = { OWNER: 'badge-owner', ADMIN: 'badge-admin', USER: 'badge-user', BANNED: 'badge-banned' };

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="card p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative">
            <UserAvatar name={profileData.name} avatar={profileData.avatar} size="xl" role={profileData.role} />
            {isOwn && (
              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  if (e.target.files?.[0]) {
                    setAvatarFile(e.target.files[0]);
                    setEditing(true);
                  }
                }} />
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </label>
            )}
          </div>
          <div className="flex-1">
            {!editing ? (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profileData.name}</h1>
                  <span className={roleBadge[profileData.role]}>{roleLabels[profileData.role]}</span>
                </div>
                {profileData.bio && <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">{profileData.bio}</p>}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Membro desde {format(new Date(profileData.createdAt), "MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="text-center">
                    <div className="font-bold text-gray-900 dark:text-white">{profileData.postsCount || 0}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900 dark:text-white">{profileData.commentsCount || 0}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Comentários</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900 dark:text-white">{profileData.likesGiven || 0}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Curtidas</div>
                  </div>
                </div>
              </>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-3 max-w-sm">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="input text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} className="input text-sm h-16 resize-none" maxLength={200} />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={savingProfile} className="btn-primary text-sm py-1.5 px-3">
                    {savingProfile ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button type="button" onClick={() => { setEditing(false); setAvatarFile(null); }}
                    className="text-sm px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
          {isOwn && !editing && (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Editar Perfil
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {isOwn && (
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
          <button onClick={() => setActiveTab('posts')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'posts' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            Postagens
          </button>
          <button onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'settings' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            Segurança
          </button>
        </div>
      )}

      {/* Posts tab */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {postsData?.posts?.length === 0 ? (
            <div className="card p-8 text-center text-gray-500 dark:text-gray-400">
              {isOwn ? 'Você ainda não publicou nenhuma postagem.' : 'Este usuário ainda não publicou nenhuma postagem.'}
            </div>
          ) : (
            postsData?.posts?.map((post: Post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      )}

      {/* Security tab */}
      {isOwn && activeTab === 'settings' && (
        <div className="card p-6 max-w-md">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Alterar Senha</h3>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha atual</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova senha</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="input" required minLength={6} />
            </div>
            <button type="submit" disabled={savingPassword} className="btn-primary text-sm py-2 px-4">
              {savingPassword ? 'Alterando...' : 'Alterar senha'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
