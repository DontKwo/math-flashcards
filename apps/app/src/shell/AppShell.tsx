import React, { useState } from 'react';
import { useRoute } from '../router/index.ts';
import { useLibrary } from '../data/useLibrary.ts';
import { Icon, Button, Toast } from '../ui/index.ts';
import './shell.css';

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { route, navigate } = useRoute();
  const { activeToast, clearToast } = useLibrary();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // If in study mode, render focused full-screen shell
  const isStudyRoute = route.pattern === 'study-learn' || route.pattern === 'study-cards';

  if (isStudyRoute) {
    return (
      <div className="shell-study-container">
        <header className="shell-study-header">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon name="close" size={18} />}
            onClick={() => navigate(`/set/${route.params.id || 'sample-deck'}`)}
            data-testid="study-exit-btn"
          >
            Exit
          </Button>
          <span className="shell-topbar-title">
            {route.pattern === 'study-learn' ? 'Learn Mode' : 'Cards Mode'}
          </span>
          <div className="shell-topbar-actions" />
        </header>

        <main className="shell-study-body">{children}</main>

        {activeToast && (
          <Toast
            message={activeToast.message}
            actionLabel={activeToast.actionLabel}
            onAction={activeToast.onAction}
            onClose={clearToast}
            type={activeToast.type}
          />
        )}
      </div>
    );
  }

  return (
    <div className="shell-container">
      {/* Desktop Sidebar (>= 768px) */}
      <aside
        className={`shell-sidebar ${sidebarCollapsed ? 'is-collapsed' : ''}`}
        aria-label="Main Navigation"
      >
        <div className="shell-brand">
          <button
            type="button"
            className="shell-brand-logo"
            onClick={() => navigate('/')}
            data-testid="nav-sidebar-brand"
          >
            <Icon name="sparkles" size={24} />
            {!sidebarCollapsed && <span>Formula Flash</span>}
          </button>
          <button
            type="button"
            className="ui-icon-btn ui-icon-btn-ghost ui-icon-btn-sm"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <Icon name="menu" size={18} />
          </button>
        </div>

        <nav className="shell-nav-list">
          <button
            type="button"
            className={`shell-nav-item ${route.pattern === 'home' ? 'is-active' : ''}`}
            onClick={() => navigate('/')}
            data-testid="nav-sidebar-home"
          >
            <Icon name="home" size={20} />
            {!sidebarCollapsed && <span>Home</span>}
          </button>

          <button
            type="button"
            className={`shell-nav-item ${route.pattern === 'create' ? 'is-active' : ''}`}
            onClick={() => navigate('/create')}
            data-testid="nav-sidebar-create"
          >
            <Icon name="plus" size={20} />
            {!sidebarCollapsed && <span>Create Set</span>}
          </button>

          <button
            type="button"
            className={`shell-nav-item ${route.pattern === 'stats' ? 'is-active' : ''}`}
            onClick={() => navigate('/stats')}
            data-testid="nav-sidebar-stats"
          >
            <Icon name="chart" size={20} />
            {!sidebarCollapsed && <span>Stats</span>}
          </button>

          <button
            type="button"
            className={`shell-nav-item ${route.pattern === 'settings' ? 'is-active' : ''}`}
            onClick={() => navigate('/settings')}
            data-testid="nav-sidebar-settings"
          >
            <Icon name="settings" size={20} />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
        </nav>
      </aside>

      {/* Main App Content Area */}
      <div className="shell-main">
        {/* Top Header Bar */}
        <header className="shell-topbar">
          <div className="shell-topbar-actions">
            <span className="shell-topbar-title">Formula Flash</span>
          </div>

          <div className="shell-topbar-actions">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Icon name="plus" size={16} />}
              onClick={() => navigate('/create')}
              data-testid="shell-create-set-btn"
            >
              Create
            </Button>
          </div>
        </header>

        {/* Scrollable Viewport Body */}
        <main className="shell-body">{children}</main>

        {/* Mobile Safe-Area Bottom Tab Bar (< 768px) */}
        <nav className="shell-bottombar" aria-label="Mobile Navigation">
          <button
            type="button"
            className={`shell-tab-item ${route.pattern === 'home' ? 'is-active' : ''}`}
            onClick={() => navigate('/')}
            data-testid="nav-bottom-home"
          >
            <Icon name="home" size={20} />
            <span>Home</span>
          </button>

          <button
            type="button"
            className="shell-tab-item shell-tab-item-create"
            onClick={() => navigate('/create')}
            data-testid="nav-bottom-create"
            aria-label="Create Set"
          >
            <Icon name="plus" size={24} />
          </button>

          <button
            type="button"
            className={`shell-tab-item ${route.pattern === 'stats' ? 'is-active' : ''}`}
            onClick={() => navigate('/stats')}
            data-testid="nav-bottom-stats"
          >
            <Icon name="chart" size={20} />
            <span>Stats</span>
          </button>

          <button
            type="button"
            className={`shell-tab-item ${route.pattern === 'settings' ? 'is-active' : ''}`}
            onClick={() => navigate('/settings')}
            data-testid="nav-bottom-settings"
          >
            <Icon name="settings" size={20} />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Active Undo / Notice Toast */}
      {activeToast && (
        <Toast
          message={activeToast.message}
          actionLabel={activeToast.actionLabel}
          onAction={activeToast.onAction}
          onClose={clearToast}
          type={activeToast.type}
        />
      )}
    </div>
  );
};
