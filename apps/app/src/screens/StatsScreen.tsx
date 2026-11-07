import React, { useState, useEffect } from 'react';
import { useLibrary } from '../data/useLibrary.ts';
import { Card, Icon, ProgressBar, EmptyState, Button } from '../ui/index.ts';
import { useRoute } from '../router/index.ts';
import { MathDisplay } from '../components/MathDisplay.tsx';
import type { CardProgress, StudySession, Card as CoreCard } from '@formulaflash/core';
import './screens.css';

interface HardCardInfo {
  card: CoreCard;
  missRate: number;
  totalAttempts: number;
}

export const StatsScreen: React.FC = () => {
  const { sets, repository } = useLibrary();
  const { navigate } = useRoute();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [progresses, setProgresses] = useState<CardProgress[]>([]);
  const [allCards, setAllCards] = useState<CoreCard[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    void (async (): Promise<void> => {
      const sessList = await repository.listSessions();
      const progList = await repository.listProgress();
      const cardsList: CoreCard[] = [];
      const setList = await repository.listSets();

      for (const s of setList) {
        const c = await repository.getCards(s.id);
        cardsList.push(...c);
      }

      if (mounted) {
        setSessions(sessList);
        setProgresses(progList);
        setAllCards(cardsList);
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [repository]);

  if (loading) {
    return <div data-testid="stats-loading">Loading stats...</div>;
  }

  const totalCards = sets.reduce((sum, s) => sum + s.cardCount, 0);

  // Honest empty state when no cards exist
  if (totalCards === 0) {
    return (
      <EmptyState
        icon={<Icon name="chart" size={48} />}
        title="No Study Stats Yet"
        description="Create your first set and start studying in Learn or Flashcards mode to see detailed mastery and retention analytics."
        action={
          <Button variant="primary" onClick={() => navigate('/create')} data-testid="stats-create-btn">
            Create a Set
          </Button>
        }
        data-testid="stats-empty"
      />
    );
  }

  // Mastery breakdown from CardProgress
  let masteredCount = 0;
  let familiarCount = 0;
  let proficientCount = 0;
  let unseenCount = 0;

  for (const card of allCards) {
    const prog = progresses.find((p) => p.cardId === card.id);
    const lvl = prog?.learn.level ?? 0;
    if (lvl === 3) masteredCount++;
    else if (lvl === 2) proficientCount++;
    else if (lvl === 1) familiarCount++;
    else unseenCount++;
  }

  const percentMastered = totalCards > 0 ? (masteredCount / totalCards) * 100 : 0;

  // Streak calculation across midnight from session timestamps
  const activeDays = new Set<string>();
  for (const sess of sessions) {
    const ts = sess.startedAt;
    const dateStr = new Date(ts).toISOString().split('T')[0];
    activeDays.add(dateStr);
  }

  let streak = 0;
  const now = new Date();
  const checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let keepChecking = true;
  while (keepChecking) {
    const key = checkDate.toISOString().split('T')[0];
    if (activeDays.has(key)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // If today has no study session yet, check if yesterday was active
      if (streak === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        const yKey = checkDate.toISOString().split('T')[0];
        if (activeDays.has(yKey)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
      }
      keepChecking = false;
    }
  }

  // Accuracy over time from StudyEvents
  let totalEvents = 0;
  let correctEvents = 0;
  for (const sess of sessions) {
    for (const ev of sess.events) {
      totalEvents++;
      if (ev.verdict.correct) {
        correctEvents++;
      }
    }
  }
  const accuracyPercent = totalEvents > 0 ? Math.round((correctEvents / totalEvents) * 100) : 0;

  // Identify hardest cards (cards with highest wrong / (right + wrong))
  const cardMap = new Map<string, CoreCard>(allCards.map((c) => [c.id, c]));
  const hardCards: HardCardInfo[] = [];

  for (const p of progresses) {
    const card = cardMap.get(p.cardId);
    if (!card) continue;
    const totalAttempts = p.stats.right + p.stats.wrong;
    if (totalAttempts > 0 && p.stats.wrong > 0) {
      hardCards.push({
        card,
        missRate: p.stats.wrong / totalAttempts,
        totalAttempts,
      });
    }
  }

  hardCards.sort((a, b) => b.missRate - a.missRate);
  const topHardCards = hardCards.slice(0, 5);

  return (
    <div className="screen-container">
      <div>
        <h1 className="screen-title">Study Stats & Mastery</h1>
        <p className="screen-subtitle">
          Real analytics calculated directly from your study sessions and card progress.
        </p>
      </div>

      <div className="stats-grid">
        <Card>
          <div className="stats-card-inner">
            <div className="stats-icon-box stats-icon-accent">
              <Icon name="book" size={24} />
            </div>
            <div>
              <span className="set-mode-desc">Total Cards</span>
              <h3 className="screen-title">{totalCards}</h3>
            </div>
          </div>
        </Card>

        <Card>
          <div className="stats-card-inner">
            <div className="stats-icon-box stats-icon-success">
              <Icon name="check" size={24} />
            </div>
            <div>
              <span className="set-mode-desc">Mastered Equations</span>
              <h3 className="screen-title">{masteredCount}</h3>
            </div>
          </div>
        </Card>

        <Card>
          <div className="stats-card-inner">
            <div className="stats-icon-box stats-icon-accent">
              <Icon name="sparkles" size={24} />
            </div>
            <div>
              <span className="set-mode-desc">Day Streak</span>
              <h3 className="screen-title">{streak} days</h3>
            </div>
          </div>
        </Card>

        <Card>
          <div className="stats-card-inner">
            <div className="stats-icon-box stats-icon-success">
              <Icon name="chart" size={24} />
            </div>
            <div>
              <span className="set-mode-desc">Overall Accuracy</span>
              <h3 className="screen-title">{totalEvents > 0 ? `${accuracyPercent}%` : 'N/A'}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Mastery Breakdown */}
      <Card>
        <h3 className="home-card-title">Overall Mastery Breakdown</h3>
        <ProgressBar value={percentMastered} aria-label="Overall mastery progress" />

        <div className="stats-breakdown-grid">
          <div className="stats-pill stats-pill-mastered">
            <span>Mastered (L3)</span>
            <p>{masteredCount}</p>
          </div>
          <div className="stats-pill stats-pill-learning">
            <span>Proficient (L2)</span>
            <p>{proficientCount}</p>
          </div>
          <div className="stats-pill stats-pill-learning">
            <span>Familiar (L1)</span>
            <p>{familiarCount}</p>
          </div>
          <div className="stats-pill stats-pill-unseen">
            <span>Unseen (L0)</span>
            <p>{unseenCount}</p>
          </div>
        </div>
      </Card>

      {/* Hardest Cards List */}
      <Card>
        <h3 className="home-card-title">Challenging Cards</h3>
        <p className="set-mode-desc">Cards that had incorrect attempts during your study sessions.</p>

        {topHardCards.length === 0 ? (
          <p className="set-mode-desc">No missed cards recorded yet. Keep up the great work!</p>
        ) : (
          <div className="editor-form">
            {topHardCards.map(({ card, missRate, totalAttempts }) => {
              const frontText = card.front.map((s) => (s.t === 'text' ? s.v : '')).join(' ');
              const backLatex = card.back.find((s) => s.t === 'math')?.t === 'math' ? (card.back.find((s) => s.t === 'math') as { latex: string }).latex : '';

              return (
                <div key={card.id} className="study-setting-row" data-testid={`stats-hard-card-${card.id}`}>
                  <div>
                    <p className="home-card-title">{frontText}</p>
                    {backLatex && (
                      <div className="set-card-math-box">
                        <MathDisplay latex={backLatex} display={false} />
                      </div>
                    )}
                  </div>
                  <div className="stats-pill stats-pill-learning">
                    <span>Miss Rate</span>
                    <p>
                      {Math.round(missRate * 100)}% ({totalAttempts} tries)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
