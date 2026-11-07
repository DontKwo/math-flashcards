import React from 'react';

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
    <div
      className="analytics-container"
      style={{
        padding: '24px',
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <h2 style={{ marginBottom: '24px', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
        Mastery Analytics
      </h2>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
        <div
          style={{
            flex: 1,
            background: 'var(--bg-card-secondary)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
            Total Sessions
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {totalSessions}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            background: 'var(--bg-card-secondary)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
            Study Streak
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {streakDays}{' '}
            <span style={{ fontSize: '16px', color: 'var(--accent-text)', fontWeight: 600 }}>days</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Mastery Breakdown
        </h3>
        <div
          style={{
            display: 'flex',
            height: '14px',
            borderRadius: '9999px',
            overflow: 'hidden',
            marginBottom: '20px',
            background: 'var(--bg-card-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          {pMastered > 0 && <div style={{ width: `${pMastered}%`, background: 'var(--success)' }} />}
          {pProficient > 0 && <div style={{ width: `${pProficient}%`, background: 'var(--info)' }} />}
          {pFamiliar > 0 && <div style={{ width: `${pFamiliar}%`, background: 'var(--warning)' }} />}
          {pUnseen > 0 && <div style={{ width: `${pUnseen}%`, background: 'var(--border)' }} />}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'var(--success-bg)',
              borderRadius: '10px',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>Mastered</span>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{stats.mastered}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'var(--info-bg)',
              borderRadius: '10px',
              border: '1px solid rgba(59, 130, 246, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--info)' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>Proficient</span>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{stats.proficient}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'var(--warning-bg)',
              borderRadius: '10px',
              border: '1px solid rgba(245, 158, 11, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--warning)' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>Familiar</span>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{stats.familiar}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'var(--bg-card-secondary)',
              borderRadius: '10px',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--text-muted)' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Unseen</span>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{stats.unseen}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
