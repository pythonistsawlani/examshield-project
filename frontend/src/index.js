import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/neon.css';
import App from './App';

if (typeof localStorage !== 'undefined' && localStorage.getItem('examshield_neonGlow') === 'false') {
  document.documentElement.classList.add('neon-glow-off');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
