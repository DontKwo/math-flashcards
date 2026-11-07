import React, { useEffect, Suspense, lazy } from 'react';
import { useRoute } from './router/index.ts';
import { useLibrary } from './data/useLibrary.ts';
import { AppShell } from './shell/AppShell.tsx';
import { Skeleton } from './ui/index.ts';

const HomeScreen = lazy(() =>
  import('./screens/HomeScreen.tsx').then((m) => ({ default: m.HomeScreen }))
);
const SetScreen = lazy(() =>
  import('./screens/SetScreen.tsx').then((m) => ({ default: m.SetScreen }))
);
const EditorScreen = lazy(() =>
  import('./screens/EditorScreen.tsx').then((m) => ({ default: m.EditorScreen }))
);
const StatsScreen = lazy(() =>
  import('./screens/StatsScreen.tsx').then((m) => ({ default: m.StatsScreen }))
);
const SettingsScreen = lazy(() =>
  import('./screens/SettingsScreen.tsx').then((m) => ({ default: m.SettingsScreen }))
);
const StudyScreen = lazy(() =>
  import('./screens/StudyScreen.tsx').then((m) => ({ default: m.StudyScreen }))
);

export const App: React.FC = () => {
  const { route } = useRoute();
  const { init } = useLibrary();

  useEffect(() => {
    void init();
  }, [init]);

  const renderScreen = (): React.ReactNode => {
    switch (route.pattern) {
      case 'home':
        return <HomeScreen />;
      case 'set-detail':
        return <SetScreen />;
      case 'set-edit':
      case 'create':
        return <EditorScreen />;
      case 'study-learn':
      case 'study-cards':
        return <StudyScreen />;
      case 'stats':
        return <StatsScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="screen-container">
            <Skeleton variant="rect" />
            <Skeleton variant="rect" />
          </div>
        }
      >
        {renderScreen()}
      </Suspense>
    </AppShell>
  );
};

export default App;
