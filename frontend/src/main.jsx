import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

/**
 * Ephemeral OAuth Fallback Handler
 * ─────────────────────────────────
 * If this page loads inside a popup with OAuth callback params,
 * communicate the result back to the parent window via postMessage
 * and auto-close. This is a fallback — the primary flow uses
 * self-closing HTML served directly from the backend callback.
 */
if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
  const search = window.location.search;
  const isOAuthCallback = search.includes('instagram_connected=true') || search.includes('instagram_error=true');

  if (isOAuthCallback) {
    try {
      window.opener.postMessage({
        type: 'INSTAGRAM_OAUTH_RESPONSE',
        success: search.includes('instagram_connected=true'),
        message: search.includes('instagram_connected=true')
          ? 'Instagram connected successfully.'
          : 'Instagram connection failed.',
        search,
      }, window.location.origin);

      // Auto-close after a brief delay
      setTimeout(() => window.close(), 500);
    } catch (e) {
      console.error('[OAuth Fallback] Failed to communicate with opener:', e);
    }
  }
}

// Suppress React DevTools download message
if (typeof window !== 'undefined') {
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
