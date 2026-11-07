import React from 'react';
import { useLibrary } from '../data/useLibrary.ts';
import { Card, Icon, ProgressBar } from '../ui/index.ts';
import './screens.css';

export const StatsScreen: React.FC = () => {
  const { sets } = useLibrary();

  const totalCards = sets.reduce((sum, s) => sum + s.cardCount, 0);
  const totalMastered = sets.reduce((sum, s) => sum + s.mastery.mastered, 0);
  const totalLearning = sets.reduce(
    (sum, s) => sum + s.mastery.familiar + s.mastery.proficient,
    0
  );
  const totalUnseen = sets.reduce((sum, s) => sum + s.mastery.unseen, 0);

  const percentMastered = totalCards > 0 ? (totalMastered / totalCards) * 100 : 0;

  return (
    <div className="screen-container">
      <div>
        <h1 className="screen-title">Study Stats & Mastery</h1>
        <p className="screen-subtitle">
          Overview of your retention and progress across all decks.
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
              <h3 className="screen-title">{totalMastered}</h3>
            </div>
          </div>
        </Card>

        <Card>
          <div className="stats-card-inner">
            <div className="stats-icon-box stats-icon-accent">
              <Icon name="sparkles" size={24} />
            </div>
            <div>
              <span className="set-mode-desc">Mastery Rate</span>
              <h3 className="screen-title">{Math.round(percentMastered)}%</h3>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="home-card-title">Overall Breakdown</h3>
        <ProgressBar value={percentMastered} aria-label="Overall mastery progress" />

        <div className="stats-breakdown-grid">
          <div className="stats-pill stats-pill-mastered">
            <span>Mastered</span>
            <p>{totalMastered}</p>
          </div>
          <div className="stats-pill stats-pill-learning">
            <span>Learning</span>
            <p>{totalLearning}</p>
          </div>
          <div className="stats-pill stats-pill-unseen">
            <span>Unseen</span>
            <p>{totalUnseen}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
