import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, Loader2, CheckCircle2, XCircle, RefreshCw, ExternalLink, X } from 'lucide-react';

/**
 * ─────────────────────────────────────────────────────
 * Ephemeral OAuth Security Tab — Production-Ready Hook
 * ─────────────────────────────────────────────────────
 * 
 * This hook manages the Instagram/Meta OAuth popup flow with:
 * - Session cleanup before each attempt (localStorage, sessionStorage)
 * - Centered popup window (600×700)
 * - postMessage communication from callback
 * - Auto-detection of popup-blocked / popup-closed
 * - 10-minute timeout for expired OAuth sessions
 * - Full retry mechanism
 */

const POPUP_WIDTH = 600;
const POPUP_HEIGHT = 700;
const OAUTH_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Clear any stale Instagram OAuth session data from browser storage.
 * This ensures every connection attempt starts fresh (ephemeral).
 */
function clearOAuthSessionData() {
  try {
    // Remove any cached Instagram tokens from localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('instagram') ||
        key.includes('ig_') ||
        key.includes('fb_') ||
        key.includes('meta_oauth')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Clear sessionStorage OAuth artifacts
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (
        key.includes('instagram') ||
        key.includes('ig_') ||
        key.includes('fb_') ||
        key.includes('meta_oauth')
      )) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(k => sessionStorage.removeItem(k));
  } catch (err) {
    console.warn('[SecurityTab] Failed to clear OAuth session data:', err);
  }
}

export function useSecurityTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'preparing' | 'pending' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [targetUrl, setTargetUrl] = useState('');

  const popupRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const onCallbackRef = useRef(null);

  /**
   * Clean up all timers and popup references.
   */
  const cleanup = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /**
   * Open the popup window centered on screen.
   */
  const launchPopup = useCallback((url) => {
    setStatus('pending');
    setErrorMsg('');
    setSuccessData(null);

    // Calculate center position
    const left = Math.round(window.screenX + (window.outerWidth - POPUP_WIDTH) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2);

    // Close any existing popup
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }

    try {
      const popup = window.open(
        url,
        'GradixOAuth',
        `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},toolbar=no,menubar=no,status=no,location=yes,scrollbars=yes,resizable=no`
      );

      if (!popup || popup.closed) {
        setStatus('error');
        setErrorMsg('Popup was blocked by your browser. Please allow popups for this site and try again.');
        return;
      }

      popupRef.current = popup;
      popup.focus();

      // ─── Poll for popup closed ───
      cleanup();
      pollIntervalRef.current = setInterval(() => {
        try {
          if (popup.closed) {
            cleanup();
            setStatus(prev => {
              if (prev === 'pending' || prev === 'preparing') {
                setErrorMsg('The authentication window was closed before completing the connection.');
                return 'error';
              }
              return prev;
            });
          }
        } catch (e) {
          // Cross-origin access errors are expected
        }
      }, 800);

      // ─── OAuth timeout (10 min) ───
      timeoutRef.current = setTimeout(() => {
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
        }
        cleanup();
        setStatus(prev => {
          if (prev === 'pending') {
            setErrorMsg('OAuth session timed out after 10 minutes. Please try again.');
            return 'error';
          }
          return prev;
        });
      }, OAUTH_TIMEOUT_MS);

    } catch (err) {
      setStatus('error');
      setErrorMsg('Failed to open authentication window: ' + err.message);
    }
  }, [cleanup]);

  /**
   * Main entry point: open the OAuth popup.
   * Clears old session data, then launches the popup.
   */
  const openSecurityTab = useCallback((url, onCallback) => {
    // Phase 1: Clear old session data
    setTargetUrl(url);
    setIsOpen(true);
    setStatus('preparing');
    setErrorMsg('');
    setSuccessData(null);
    onCallbackRef.current = onCallback;

    // Clear stale data before launching
    clearOAuthSessionData();

    // Small delay for UX — show "Preparing..." state briefly
    setTimeout(() => {
      launchPopup(url);
    }, 300);
  }, [launchPopup]);

  /**
   * Listen for postMessage from the OAuth popup callback.
   */
  useEffect(() => {
    const handleMessage = (event) => {
      // Accept messages from the popup (callback page is served by our backend)
      if (event.data?.type !== 'INSTAGRAM_OAUTH_RESPONSE') return;

      cleanup();

      if (event.data.success) {
        setStatus('success');
        setSuccessData({
          username: event.data.username,
          followers: event.data.followers,
          profilePicture: event.data.profilePicture,
          message: event.data.message,
        });

        // Auto-close modal after showing success
        setTimeout(() => {
          setIsOpen(false);
          if (onCallbackRef.current) {
            onCallbackRef.current(true, event.data);
          }
        }, 2000);
      } else {
        setStatus('error');
        setErrorMsg(event.data.message || 'Authentication was unsuccessful. Please try again.');
        if (onCallbackRef.current) {
          onCallbackRef.current(false, event.data);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      cleanup();
    };
  }, [cleanup]);

  /**
   * Close the modal and any open popup.
   */
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setStatus('idle');
    cleanup();
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
  }, [cleanup]);

  /**
   * Retry the OAuth flow from scratch.
   */
  const retry = useCallback(() => {
    clearOAuthSessionData();
    setErrorMsg('');
    setSuccessData(null);
    launchPopup(targetUrl);
  }, [targetUrl, launchPopup]);

  return {
    isOpen,
    status,
    errorMsg,
    successData,
    openSecurityTab,
    closeModal,
    retry,
    targetUrl,
  };
}

/**
 * ─────────────────────────────────────────────────
 * SecurityTabModal — Invisible (runs in background)
 * ─────────────────────────────────────────────────
 * The OAuth flow happens entirely in the popup window.
 * No overlay is shown on the parent page.
 */
export function SecurityTabModal({ state }) {
  return null;
}
