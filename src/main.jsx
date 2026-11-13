import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/overpass/400.css';
import '@fontsource/overpass/600.css';
import '@fontsource/overpass/800.css';
import '@fontsource/overpass-mono/600.css';
import '@fontsource/mukta/600.css';
import './styles.css';
import App from './App';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
