import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Bot, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }

    setLoading(true);

    try {
      await register(username, email, password, inviteCode);
      navigate('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
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
          <p className="text-[var(--color-text-muted)] mt-1">创建新账户</p>
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
              placeholder="3-50个字符"
              required
              minLength={3}
              maxLength={50}
              className="w-full px-3 py-2.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)]
                         rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]
                         placeholder:text-[var(--color-text-muted)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
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
                placeholder="至少6个字符"
                required
                minLength={6}
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

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              邀请码 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="请输入邀请码"
              required
              className="w-full px-3 py-2.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)]
                         rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]
                         placeholder:text-[var(--color-text-muted)]"
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              需要有效的邀请码才能注册，请联系管理员获取
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
                       rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? '注册中...' : '注册'}
          </button>

          <p className="text-center text-sm text-[var(--color-text-muted)]">
            已有账户？{' '}
            <Link to="/login" className="text-[var(--color-accent-hover)] hover:underline">
              登录
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
