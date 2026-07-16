import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  MessageSquare,
  Bot,
  Shield,
  LogOut,
  Menu,
  User,
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/chat', icon: MessageSquare, label: 'AI 问答' },
    { path: '/agent', icon: Bot, label: 'Agent' },
    ...(user?.is_admin
      ? [{ path: '/admin', icon: Shield, label: '管理后台' }]
      : []),
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)]
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="p-5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">AI Platform</h1>
              <p className="text-xs text-[var(--color-text-muted)]">智能问答 & Agent</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                  transition-colors duration-150
                  ${
                    isActive
                      ? 'bg-[var(--color-accent-light)] text-[var(--color-accent-hover)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                  }
                `}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User info & logout */}
        <div className="p-3 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <User size={16} className="text-[var(--color-text-secondary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-[var(--color-text-muted)] truncate">
                {user?.is_admin ? '管理员' : '用户'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 mt-1 rounded-lg text-sm
                       text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]
                       hover:text-[var(--color-danger)] transition-colors duration-150"
          >
            <LogOut size={18} />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)]"
          >
            <Menu size={20} />
          </button>
          <h1 className="font-semibold text-sm">AI Platform</h1>
          <div className="w-8" />
        </div>

        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
