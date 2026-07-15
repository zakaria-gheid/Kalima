import { HashRouter, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/presentation/hooks/useTheme';
import { AppLayout } from '@/presentation/layouts/AppLayout';
import { HomePage } from '@/presentation/pages/HomePage';
import { DifficultyPage } from '@/presentation/pages/DifficultyPage';
import { GamePage } from '@/presentation/pages/GamePage';
import { CompletionPage } from '@/presentation/pages/CompletionPage';
import { WordsPage } from '@/presentation/pages/WordsPage';
import { SettingsPage } from '@/presentation/pages/SettingsPage';
import { LeaderboardPage } from '@/presentation/pages/LeaderboardPage';

const queryClient = new QueryClient();

export function App() {
  useTheme();
  const reduceAnimations = useSettingsStore((state) => state.reduceAnimations);

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion={reduceAnimations ? 'always' : 'user'}>
        <HashRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/difficulty" element={<DifficultyPage />} />
              <Route path="/game" element={<GamePage />} />
              <Route path="/completion" element={<CompletionPage />} />
              <Route path="/words" element={<WordsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </MotionConfig>
    </QueryClientProvider>
  );
}
