import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './index.css';
import App from './App.jsx';

// Vercel Analytics + Speed Insights.
// Both auto-detect Vercel deployments and stay silent otherwise, so they
// won't fire in local dev. Flip both on in the Vercel dashboard
// (Project → Analytics, Project → Speed Insights) to start collecting data.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
);
