import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

interface Props { resetMode?: boolean; }

export default function LoginPage({ resetMode = false }: Props) {
  const { login } = useAuth();
  const { settings } = useTheme();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>(resetMode ? 'reset' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao fazer login.');
    } finally { setLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      toast.success('Se o e-mail estiver cadastrado, você receberá as instruções.');
      setMode('reset');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao enviar e-mail.');
    } finally { setLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Senha deve ter no mínimo 6 caracteres.'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(resetToken, newPassword);
      toast.success('Senha alterada com sucesso!');
      setMode('login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Token inválido ou expirado.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          {settings?.logo ? (
            <img src={settings.logo} alt={settings.siteName} className="h-12 mx-auto mb-4" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{settings?.siteName || 'PostHub'}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{settings?.welcomeMessage || 'Bem-vindo de volta!'}</p>
        </div>

        <div className="card p-8 shadow-xl">
          {mode === 'login' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Entrar na sua conta</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">E-mail</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com" className="input" required autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Senha</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)} placeholder="••••••" className="input pr-10" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                  <button type="button" onClick={() => setMode('forgot')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1 block text-right">
                    Esqueceu a senha?
                  </button>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
                  {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Entrar
                </button>
              </form>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                Não tem conta?{' '}
                <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Cadastre-se</Link>
              </p>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Recuperar senha</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Informe seu e-mail para receber as instruções.</p>
              <form onSubmit={handleForgot} className="space-y-4">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com" className="input" required autoFocus />
                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                  {loading ? 'Enviando...' : 'Enviar instruções'}
                </button>
              </form>
              <button onClick={() => setMode('login')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-4 block text-center">
                Voltar ao login
              </button>
            </>
          )}

          {mode === 'reset' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nova senha</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Insira o token recebido e sua nova senha.</p>
              <form onSubmit={handleReset} className="space-y-4">
                <input type="text" value={resetToken} onChange={e => setResetToken(e.target.value)}
                  placeholder="Token de recuperação" className="input" required />
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Nova senha (mínimo 6 caracteres)" className="input" required />
                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                  {loading ? 'Salvando...' : 'Alterar senha'}
                </button>
              </form>
              <button onClick={() => setMode('login')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-4 block text-center">
                Voltar ao login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
