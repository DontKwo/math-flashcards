import React from 'react';
import '../index.css';

export interface MasteryStats {
  mastered: number;
  proficient: number;
  familiar: number;
  unseen: number;
}

export interface AnalyticsProps {
  stats: MasteryStats;
  totalSessions: number;
  streakDays: number;
}

// Renders the mastery analytics view.
export const AnalyticsView: React.FC<AnalyticsProps> = ({ stats, totalSessions, streakDays }) => {
  const totalCards = stats.mastered + stats.proficient + stats.familiar + stats.unseen;

  const getPercent = (count: number): number => {
    if (totalCards === 0) return 0;
    return (count / totalCards) * 100;
  };

  const pMastered = getPercent(stats.mastered);
  const pProficient = getPercent(stats.proficient);
  const pFamiliar = getPercent(stats.familiar);
  const pUnseen = getPercent(stats.unseen);

  return (
    <div className="analytics-container" style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 600 }}>Mastery Analytics</h2>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
        <div style={{ flex: 1, background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '12px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Sessions</div>
          <div style={{ fontSize: '28px', fontWeight: 700 }}>{totalSessions}</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '12px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Study Streak</div>
          <div style={{ fontSize: '28px', fontWeight: 700 }}>{streakDays} <span style={{ fontSize: '16px', color: 'var(--accent)' }}>days</span></div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '12px', fontWeight: 600 }}>Mastery Breakdown</h3>
        <div style={{ display: 'flex', height: '12px', borderRadius: '9999px', overflow: 'hidden', marginBottom: '16px', background: 'var(--border)' }}>
          {pMastered > 0 && <div style={{ width: `${pMastered}%`, background: 'var(--success)' }} />}
          {pProficient > 0 && <div style={{ width: `${pProficient}%`, background: '#3b82f6' }} />}
          {pFamiliar > 0 && <div style={{ width: `${pFamiliar}%`, background: '#f59e0b' }} />}
          {pUnseen > 0 && <div style={{ width: `${pUnseen}%`, background: 'var(--text-muted)' }} />}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Mastered</span>
            </div>
            <span style={{ fontWeight: 600 }}>{stats.mastered}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Proficient</span>
            </div>
            <span style={{ fontWeight: 600 }}>{stats.proficient}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Familiar</span>
            </div>
            <span style={{ fontWeight: 600 }}>{stats.familiar}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(100, 116, 139, 0.1)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--text-muted)' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Unseen</span>
            </div>
            <span style={{ fontWeight: 600 }}>{stats.unseen}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
