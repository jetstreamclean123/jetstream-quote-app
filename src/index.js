// Entry point for the Jet Stream Clean quote app.
//
// This file bootstraps the React application by rendering the root
// component into the DOM.  It also imports the Tailwind CSS
// stylesheet so that your classes take effect.

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
