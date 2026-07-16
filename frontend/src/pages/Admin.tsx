import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  Users,
  Key,
  MessageSquare,
  Activity,
  Copy,
  Check,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Plus,
  RefreshCw,
} from 'lucide-react';

interface Stats {
  total_users: number;
  active_users: number;
  total_conversations: number;
  total_messages: number;
  total_invite_codes: number;
  used_invite_codes: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

interface InviteCode {
  id: string;
  code: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

type Tab = 'dashboard' | 'users' | 'invites';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [newCodeMaxUses, setNewCodeMaxUses] = useState(1);
  const [newCodeExpiry, setNewCodeExpiry] = useState('');

  const loadStats = useCallback(async () => {
    try {
      const data = await api.get('/admin/stats');
      setStats(data);
    } catch (err) {
      console.error('加载统计失败:', err);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const data = await api.get('/admin/users');
      setUsers(data);
    } catch (err) {
      console.error('加载用户列表失败:', err);
    }
  }, []);

  const loadInviteCodes = useCallback(async () => {
    try {
      const data = await api.get('/admin/invite-codes');
      setInviteCodes(data);
    } catch (err) {
      console.error('加载邀请码列表失败:', err);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadUsers();
    loadInviteCodes();
  }, [loadStats, loadUsers, loadInviteCodes]);

  const handleToggleUser = async (userId: string) => {
    try {
      const result = await api.put(`/admin/users/${userId}/toggle`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_active: result.is_active } : u
        )
      );
      loadStats();
    } catch (err) {
      console.error('切换用户状态失败:', err);
    }
  };

  const handleCreateInviteCode = async () => {
    try {
      const body: Record<string, unknown> = { max_uses: newCodeMaxUses };
      if (newCodeExpiry) {
        body.expires_in_days = parseInt(newCodeExpiry);
      }
      await api.post('/admin/invite-codes', body);
      setNewCodeMaxUses(1);
      setNewCodeExpiry('');
      loadInviteCodes();
      loadStats();
    } catch (err) {
      console.error('创建邀请码失败:', err);
    }
  };

  const handleToggleInviteCode = async (codeId: string) => {
    try {
      const result = await api.put(`/admin/invite-codes/${codeId}/toggle`);
      setInviteCodes((prev) =>
        prev.map((c) =>
          c.id === codeId ? { ...c, is_active: result.is_active } : c
        )
      );
    } catch (err) {
      console.error('切换邀请码状态失败:', err);
    }
  };

  const handleDeleteInviteCode = async (codeId: string) => {
    if (!confirm('确定删除此邀请码？')) return;
    try {
      await api.delete(`/admin/invite-codes/${codeId}`);
      setInviteCodes((prev) => prev.filter((c) => c.id !== codeId));
      loadStats();
    } catch (err) {
      console.error('删除邀请码失败:', err);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const tabs = [
    { key: 'dashboard' as Tab, label: '仪表盘', icon: Activity },
    { key: 'users' as Tab, label: '用户管理', icon: Users },
    { key: 'invites' as Tab, label: '邀请码', icon: Key },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors
              border-b-2 -mb-[1px]
              ${
                activeTab === tab.key
                  ? 'border-[var(--color-accent)] text-[var(--color-accent-hover)]'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }
            `}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* 仪表盘 */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">系统概览</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                icon={<Users size={20} />}
                label="总用户数"
                value={stats.total_users}
                color="text-blue-400"
              />
              <StatCard
                icon={<Users size={20} />}
                label="活跃用户"
                value={stats.active_users}
                color="text-green-400"
              />
              <StatCard
                icon={<MessageSquare size={20} />}
                label="总对话数"
                value={stats.total_conversations}
                color="text-purple-400"
              />
              <StatCard
                icon={<MessageSquare size={20} />}
                label="总消息数"
                value={stats.total_messages}
                color="text-yellow-400"
              />
              <StatCard
                icon={<Key size={20} />}
                label="总邀请码"
                value={stats.total_invite_codes}
                color="text-pink-400"
              />
              <StatCard
                icon={<Key size={20} />}
                label="已使用邀请码"
                value={stats.used_invite_codes}
                color="text-orange-400"
              />
            </div>
          </div>
        )}

        {/* 用户管理 */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">用户管理</h2>
              <button
                onClick={loadUsers}
                className="flex items-center gap-1 text-sm text-[var(--color-text-muted)]
                           hover:text-[var(--color-text-secondary)] transition-colors"
              >
                <RefreshCw size={14} />
                刷新
              </button>
            </div>

            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                      用户名
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                      邮箱
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                      角色
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                      状态
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                      注册时间
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-[var(--color-border)] last:border-b-0"
                    >
                      <td className="px-4 py-3 text-sm">{user.username}</td>
                      <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {user.is_admin ? (
                          <span className="text-[var(--color-accent)]">管理员</span>
                        ) : (
                          <span className="text-[var(--color-text-muted)]">用户</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`
                            inline-block px-2 py-0.5 rounded-full text-xs font-medium
                            ${user.is_active
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400'
                            }
                          `}
                        >
                          {user.is_active ? '活跃' : '已禁用'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                        {new Date(user.created_at).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleToggleUser(user.id)}
                          disabled={user.is_admin}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.is_admin
                              ? 'opacity-30 cursor-not-allowed'
                              : 'hover:bg-[var(--color-bg-hover)]'
                          }`}
                          title={user.is_admin ? '不能操作管理员' : user.is_active ? '禁用' : '启用'}
                        >
                          {user.is_active ? (
                            <ToggleRight size={20} className="text-green-400" />
                          ) : (
                            <ToggleLeft size={20} className="text-[var(--color-text-muted)]" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 邀请码管理 */}
        {activeTab === 'invites' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">邀请码管理</h2>

            {/* 创建邀请码 */}
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
              <div className="flex items-end gap-3 flex-wrap">
                <div>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">
                    最大使用次数
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newCodeMaxUses}
                    onChange={(e) => setNewCodeMaxUses(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)]
                               rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">
                    有效期（天，可选）
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newCodeExpiry}
                    onChange={(e) => setNewCodeExpiry(e.target.value)}
                    placeholder="不限"
                    className="w-24 px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)]
                               rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]
                               placeholder:text-[var(--color-text-muted)]"
                  />
                </div>
                <button
                  onClick={handleCreateInviteCode}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)]
                             hover:bg-[var(--color-accent-hover)] text-sm font-medium transition-colors"
                >
                  <Plus size={16} />
                  生成邀请码
                </button>
              </div>
            </div>

            {/* 邀请码列表 */}
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                      邀请码
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                      使用情况
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                      状态
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                      有效期
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                      创建时间
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inviteCodes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-sm text-[var(--color-text-muted)]">
                        暂无邀请码，请创建一个
                      </td>
                    </tr>
                  ) : (
                    inviteCodes.map((code) => (
                      <tr
                        key={code.id}
                        className="border-b border-[var(--color-border)] last:border-b-0"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono bg-[var(--color-bg-primary)] px-2 py-1 rounded">
                              {code.code}
                            </code>
                            <button
                              onClick={() => handleCopy(code.code)}
                              className="p-1 rounded hover:bg-[var(--color-bg-hover)] transition-colors"
                            >
                              {copied === code.code ? (
                                <Check size={14} className="text-green-400" />
                              ) : (
                                <Copy size={14} className="text-[var(--color-text-muted)]" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={
                              code.current_uses >= code.max_uses
                                ? 'text-red-400'
                                : 'text-[var(--color-text-secondary)]'
                            }
                          >
                            {code.current_uses} / {code.max_uses}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`
                              inline-block px-2 py-0.5 rounded-full text-xs font-medium
                              ${code.is_active
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                              }
                            `}
                          >
                            {code.is_active ? '有效' : '已禁用'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                          {code.expires_at
                            ? new Date(code.expires_at).toLocaleDateString('zh-CN')
                            : '永久'}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                          {new Date(code.created_at).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggleInviteCode(code.id)}
                              className="p-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
                              title={code.is_active ? '禁用' : '启用'}
                            >
                              {code.is_active ? (
                                <ToggleRight size={18} className="text-green-400" />
                              ) : (
                                <ToggleLeft size={18} className="text-[var(--color-text-muted)]" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteInviteCode(code.id)}
                              className="p-1.5 rounded-lg hover:bg-[var(--color-bg-hover)]
                                         text-[var(--color-text-muted)] hover:text-[var(--color-danger)]
                                         transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`${color}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
        </div>
      </div>
    </div>
  );
}
