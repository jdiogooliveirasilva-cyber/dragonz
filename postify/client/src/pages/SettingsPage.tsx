import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi, postsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { SiteSettings, Category } from '../types';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { isOwner, isAdmin } = useAuth();
  const { refreshSettings } = useTheme();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'media' | 'categories' | 'maintenance'>('general');
  const [saving, setSaving] = useState(false);

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get().then(r => r.data.data as SiteSettings),
  });

  const { data: categoriesData, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => postsApi.getCategories().then(r => r.data.data as Category[]),
  });

  const [form, setForm] = useState<Partial<SiteSettings>>({});

  useEffect(() => {
    if (settingsData) {
      setForm({
        siteName: settingsData.siteName,
        description: settingsData.description,
        theme: settingsData.theme,
        primaryColor: settingsData.primaryColor,
        secondaryColor: settingsData.secondaryColor,
        fontFamily: settingsData.fontFamily,
        footerText: settingsData.footerText,
        welcomeMessage: settingsData.welcomeMessage,
        maintenanceMessage: settingsData.maintenanceMessage,
        socialLinks: settingsData.socialLinks,
      });
    }
  }, [settingsData]);

  const update = (key: keyof typeof form, value: any) => setForm(prev => ({ ...prev, [key]: value }));
  const updateSocial = (platform: string, url: string) => {
    setForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), [platform]: url } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.update(form);
      refreshSettings();
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Configurações salvas!');
    } catch { toast.error('Erro ao salvar configurações.'); }
    finally { setSaving(false); }
  };

  const handleToggleMaintenance = async () => {
    try {
      const { data } = await settingsApi.toggleMaintenance();
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      refreshSettings();
      toast.success(data.data.maintenanceMode ? 'Site em manutenção!' : 'Site reaberto!');
    } catch { toast.error('Erro ao alternar manutenção.'); }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    try {
      await settingsApi.uploadBanner(e.target.files[0]);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Banner adicionado!');
    } catch { toast.error('Erro ao enviar banner.'); }
  };

  const handleSidebarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    try {
      await settingsApi.uploadSidebarImage(e.target.files[0]);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Imagem adicionada!');
    } catch { toast.error('Erro ao enviar imagem.'); }
  };

  const handleRemoveBanner = async (url: string) => {
    try {
      await settingsApi.removeBanner(url);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Banner removido.');
    } catch { toast.error('Erro ao remover.'); }
  };

  const handleRemoveSidebar = async (url: string) => {
    try {
      await settingsApi.removeSidebarImage(url);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Imagem removida.');
    } catch { toast.error('Erro ao remover.'); }
  };

  const [newCategory, setNewCategory] = useState({ name: '', description: '', color: '#6366f1' });

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    try {
      await postsApi.createCategory(newCategory);
      refetchCategories();
      setNewCategory({ name: '', description: '', color: '#6366f1' });
      toast.success('Categoria criada!');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao criar categoria.'); }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Excluir categoria "${name}"?`)) return;
    try {
      await postsApi.deleteCategory(id);
      refetchCategories();
      toast.success('Categoria excluída.');
    } catch { toast.error('Erro ao excluir.'); }
  };

  const tabs = [
    { id: 'general', label: 'Geral', show: isOwner },
    { id: 'appearance', label: 'Aparência', show: isOwner },
    { id: 'media', label: 'Mídias', show: isAdmin },
    { id: 'categories', label: 'Categorias', show: isAdmin },
    { id: 'maintenance', label: 'Manutenção', show: isOwner },
  ].filter(t => t.show);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações do Site</h1>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-gray-200 dark:border-gray-800">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* General */}
      {activeTab === 'general' && (
        <div className="card p-6 space-y-4 max-w-2xl">
          <h2 className="font-semibold text-gray-900 dark:text-white">Informações Gerais</h2>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do site</label><input value={form.siteName || ''} onChange={e => update('siteName', e.target.value)} className="input" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label><textarea value={form.description || ''} onChange={e => update('description', e.target.value)} className="input h-20 resize-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensagem de boas-vindas</label><input value={form.welcomeMessage || ''} onChange={e => update('welcomeMessage', e.target.value)} className="input" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Texto do rodapé</label><input value={form.footerText || ''} onChange={e => update('footerText', e.target.value)} className="input" /></div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Redes sociais</label>
            <div className="space-y-2">
              {['facebook', 'twitter', 'instagram', 'youtube', 'linkedin', 'tiktok'].map(p => (
                <div key={p} className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 capitalize w-20 flex-shrink-0">{p}</span>
                  <input value={(form.socialLinks as any)?.[p] || ''} onChange={e => updateSocial(p, e.target.value)} placeholder={`https://${p}.com/...`} className="input text-sm flex-1" />
                </div>
              ))}
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      )}

      {/* Appearance */}
      {activeTab === 'appearance' && (
        <div className="card p-6 space-y-4 max-w-2xl">
          <h2 className="font-semibold text-gray-900 dark:text-white">Aparência</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cor primária</label>
              <div className="flex gap-2">
                <input type="color" value={form.primaryColor || '#6366f1'} onChange={e => update('primaryColor', e.target.value)} className="w-12 h-10 rounded border border-gray-300 dark:border-gray-700 cursor-pointer" />
                <input value={form.primaryColor || '#6366f1'} onChange={e => update('primaryColor', e.target.value)} className="input flex-1 text-sm font-mono" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cor secundária</label>
              <div className="flex gap-2">
                <input type="color" value={form.secondaryColor || '#8b5cf6'} onChange={e => update('secondaryColor', e.target.value)} className="w-12 h-10 rounded border border-gray-300 dark:border-gray-700 cursor-pointer" />
                <input value={form.secondaryColor || '#8b5cf6'} onChange={e => update('secondaryColor', e.target.value)} className="input flex-1 text-sm font-mono" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fonte</label>
            <select value={form.fontFamily || 'Inter'} onChange={e => update('fontFamily', e.target.value)} className="input">
              <option value="Inter">Inter</option>
              <option value="Poppins">Poppins</option>
              <option value="Roboto">Roboto</option>
              <option value="system-ui">System UI</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tema padrão</label>
            <select value={form.theme || 'light'} onChange={e => update('theme', e.target.value)} className="input">
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
            </select>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Salvando...' : 'Salvar aparência'}
          </button>
        </div>
      )}

      {/* Media */}
      {activeTab === 'media' && (
        <div className="space-y-6 max-w-2xl">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Banners</h2>
            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              <span className="text-sm text-gray-500 dark:text-gray-400">Adicionar banner</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
            </label>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {settingsData?.bannerImages?.map((url, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden">
                  <img src={url} alt={`Banner ${i+1}`} className="w-full h-32 object-cover" />
                  <button onClick={() => handleRemoveBanner(url)}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Imagens Laterais</h2>
            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              <span className="text-sm text-gray-500 dark:text-gray-400">Adicionar imagem lateral</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleSidebarUpload} />
            </label>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {settingsData?.sidebarImages?.map((url, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden">
                  <img src={url} alt={`Sidebar ${i+1}`} className="w-full h-32 object-cover" />
                  <button onClick={() => handleRemoveSidebar(url)}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-4 max-w-2xl">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Nova Categoria</h2>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div className="flex gap-3">
                <input value={newCategory.name} onChange={e => setNewCategory(p => ({...p, name: e.target.value}))}
                  placeholder="Nome da categoria" className="input flex-1" required />
                <input type="color" value={newCategory.color} onChange={e => setNewCategory(p => ({...p, color: e.target.value}))}
                  className="w-12 h-10 rounded border border-gray-300 dark:border-gray-700 cursor-pointer flex-shrink-0" />
              </div>
              <input value={newCategory.description} onChange={e => setNewCategory(p => ({...p, description: e.target.value}))}
                placeholder="Descrição (opcional)" className="input" />
              <button type="submit" className="btn-primary text-sm py-1.5 px-4">Criar categoria</button>
            </form>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Categorias existentes</h2>
            <div className="space-y-2">
              {categoriesData?.map(cat => (
                <div key={cat.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{cat.name}</p>
                    {cat.description && <p className="text-xs text-gray-400 truncate">{cat.description}</p>}
                  </div>
                  <button onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors flex-shrink-0">Excluir</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Maintenance */}
      {activeTab === 'maintenance' && isOwner && (
        <div className="max-w-2xl space-y-4">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Modo de Manutenção</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Quando ativado, apenas administradores e o dono podem acessar o site.
            </p>
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800 mb-4">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Status atual</p>
                <p className={`text-sm font-semibold ${settingsData?.maintenanceMode ? 'text-red-500' : 'text-green-500'}`}>
                  {settingsData?.maintenanceMode ? '🔴 Em manutenção' : '🟢 Online'}
                </p>
              </div>
              <button onClick={handleToggleMaintenance}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${settingsData?.maintenanceMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                {settingsData?.maintenanceMode ? 'Reabrir site' : 'Fechar site'}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensagem de manutenção</label>
              <textarea value={form.maintenanceMessage || ''} onChange={e => update('maintenanceMessage', e.target.value)}
                className="input h-20 resize-none" placeholder="Mensagem exibida durante a manutenção..." />
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary mt-3">
              {saving ? 'Salvando...' : 'Salvar mensagem'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
