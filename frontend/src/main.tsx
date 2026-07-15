import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { useSettingsStore } from '@/store/settingsStore';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found');
}
const root = createRoot(container);

// Open (and on first run, seed) the local SQLite database before rendering,
// so every screen can query synchronously through the service layer.
useSettingsStore
  .getState()
  .hydrate()
  .then(() => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch((error: unknown) => {
    root.render(
      <div role="alert" style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Kalima could not start</h1>
        <p>The local database failed to open. Try reloading the app.</p>
        <pre>{error instanceof Error ? error.message : String(error)}</pre>
      </div>,
    );
  });
