import React, { useState } from 'react';
import { useLibrary } from '../data/useLibrary.ts';
import { useRoute } from '../router/index.ts';
import { Card, Button, Input, Chip, EmptyState, Icon, MasteryRing, Skeleton } from '../ui/index.ts';
import './screens.css';

export const HomeScreen: React.FC = () => {
  const { sets, loading, error } = useLibrary();
  const { navigate } = useRoute();
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) {
    return (
      <div className="screen-container" data-testid="home-loading">
        <Skeleton variant="rect" />
        <Skeleton variant="rect" />
        <Skeleton variant="rect" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Failed to load sets"
        description={error}
        action={
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        }
        data-testid="home-error"
      />
    );
  }

  const filteredSets = sets.filter((s) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = s.title.toLowerCase().includes(q);
    const tagMatch = s.tags.some((t) => t.toLowerCase().includes(q));
    return titleMatch || tagMatch;
  });

  return (
    <div className="screen-container">
      <div className="home-search-bar">
        <div className="home-search-input-wrap">
          <Input
            prefixNode={<Icon name="search" size={18} />}
            placeholder="Search sets by title or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="home-search-input"
          />
        </div>
        <Button
          variant="primary"
          leftIcon={<Icon name="plus" size={18} />}
          onClick={() => navigate('/create')}
          data-testid="home-create-set"
        >
          Create Set
        </Button>
      </div>

      {filteredSets.length === 0 ? (
        <EmptyState
          icon={<Icon name="book" size={48} />}
          title={searchQuery ? 'No matching sets found' : 'Your library is empty'}
          description={
            searchQuery
              ? 'Try adjusting your search terms or filters.'
              : 'Create your first flashcard set to start mastering STEM equations.'
          }
          action={
            <Button
              variant="primary"
              onClick={() => navigate('/create')}
              data-testid="home-empty-create-btn"
            >
              Create New Set
            </Button>
          }
          data-testid="home-empty-state"
        />
      ) : (
        <div className="home-set-grid">
          {filteredSets.map((s) => {
            const total = s.cardCount;
            const masteredPercent = total > 0 ? (s.mastery.mastered / total) * 100 : 0;

            return (
              <Card
                key={s.id}
                interactive
                onClick={() => navigate(`/set/${s.id}`)}
                data-testid={`home-set-card-${s.id}`}
              >
                <div className="home-card-header">
                  <div>
                    <h3 className="home-card-title">{s.title}</h3>
                    <div className="home-card-tags">
                      {s.tags.map((tag) => (
                        <Chip key={tag} variant="accent">
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <MasteryRing percent={masteredPercent} size={42} strokeWidth={4} />
                </div>

                <div className="home-card-meta">
                  <span>{s.cardCount} cards</span>
                  <span>
                    {s.mastery.mastered} mastered · {s.mastery.familiar + s.mastery.proficient} learning
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
