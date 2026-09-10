import React from 'react';
import { createRoot } from 'react-dom/client';
import * as bootstrap from 'bootstrap';
import App from './App.jsx';
import '../styles.css';

window.bootstrap = bootstrap;

createRoot(document.getElementById('root')).render(<App />);
