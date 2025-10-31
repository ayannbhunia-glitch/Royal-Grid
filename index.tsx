import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToasterProvider } from './hooks/use-toast';
import { AuthProvider } from './lib/auth-context';
import { GameSessionProvider } from './lib/game-session-context';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <GameSessionProvider>
        <ToasterProvider>
          <App />
        </ToasterProvider>
      </GameSessionProvider>
    </AuthProvider>
  </React.StrictMode>
);