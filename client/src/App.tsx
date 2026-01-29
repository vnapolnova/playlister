import { Routes, Route, Link } from 'react-router-dom';
import ImportPage from './routes/ImportPage';
import ComparisonPage from './routes/ComparisonPage';
import SettingsPage from './routes/SettingsPage';
import './App.css';

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <h1 className="app-title">Playlister</h1>
        <div className="nav-links">
          <Link to="/">Import</Link>
          <Link to="/compare">Compare</Link>
          <Link to="/settings">Settings</Link>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<ImportPage />} />
          <Route path="/compare" element={<ComparisonPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
