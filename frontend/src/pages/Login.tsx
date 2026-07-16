import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Bot, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <Bot size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">AI Platform</h1>
          <p className="text-[var(--color-text-muted)] mt-1">登录您的账户</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 space-y-4"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
              className="w-full px-3 py-2.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)]
                         rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]
                         placeholder:text-[var(--color-text-muted)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              密码
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
                className="w-full px-3 py-2.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)]
                           rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]
                           placeholder:text-[var(--color-text-muted)] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]
                           hover:text-[var(--color-text-secondary)]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
                       rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>

          <p className="text-center text-sm text-[var(--color-text-muted)]">
            还没有账户？{' '}
            <Link to="/register" className="text-[var(--color-accent-hover)] hover:underline">
              注册
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
