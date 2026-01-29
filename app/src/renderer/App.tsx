import React from 'react';
import { HashRouter, NavLink, Route, Routes, Navigate } from 'react-router-dom';
import Settings from './routes/Settings';
import Import from './routes/Import';

const App = () => {
  const isBrowserMode = !window.api;
  const apiMode = isBrowserMode ? 'HTTP API' : 'Electron IPC';
  
  return (
    <HashRouter>
      <div className="app-shell">
        <header className="app-header">
          <div>
            <h1>Playlister</h1>
            <p className="subtitle">YouTube Music playlist import (v1)</p>
          </div>
          <nav className="nav-links">
            <NavLink to="/settings">Settings</NavLink>
            <NavLink to="/import">Import</NavLink>
            {isBrowserMode && (
              <span className="dev-mode-badge">{apiMode} Mode</span>
            )}
          </nav>
        </header>

        <main className="app-content">
          {isBrowserMode && (
            <div className="dev-mode-banner">
              🔧 Running in browser with {apiMode}. Real data with encryption via dev server on port 17601.
            </div>
          )}
          <Routes>
            <Route path="/" element={<Navigate to="/settings" replace />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/import" element={<Import />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
