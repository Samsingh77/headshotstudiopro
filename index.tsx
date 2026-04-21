
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

window.addEventListener('error', (event) => {
  console.error('Global Error caught:', event.error);
  if (event.error?.message?.toLowerCase().includes('refresh token not found') || 
      event.error?.message?.toLowerCase().includes('invalid refresh token')) {
    console.warn('Auth issue caught globally, letting App handle it:', event.error.message);
    return;
  }
  
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">
      <h2>Application Error</h2>
      <p>${event.error?.message || 'Unknown error'}</p>
      <pre style="font-size: 10px; opacity: 0.7;">${event.error?.stack || ''}</pre>
    </div>`;
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
