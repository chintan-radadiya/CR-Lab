/* Applied in the document head, before styles load, to avoid a theme flash. */
(function (root) {
  'use strict';

  const STORAGE_KEY = 'cr_practice_theme_v1';
  const choices = new Set(['system', 'light', 'dark']);
  const subscribers = new Set();
  let preference = 'system';
  let resolved = 'light';
  let media = null;
  let lastState = '';

  function normalize(value) {
    return choices.has(value) ? value : 'system';
  }

  try {
    preference = normalize(root.localStorage.getItem(STORAGE_KEY));
  } catch (_) {
    // Theme selection remains available when browser storage is unavailable.
  }
  try {
    media = root.matchMedia('(prefers-color-scheme: dark)');
  } catch (_) {
    // Older browsers without matchMedia receive the light system fallback.
  }

  function apply(announce = true) {
    resolved = preference === 'system' ? (media && media.matches ? 'dark' : 'light') : preference;
    const document = root.document;
    const element = document && document.documentElement;
    if (element) {
      element.dataset.theme = resolved;
      element.style.colorScheme = resolved;
    }
    const themeColor = document && document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', resolved === 'dark' ? '#121e26' : '#f5f3ed');

    const nextState = preference + ':' + resolved;
    const changed = nextState !== lastState;
    lastState = nextState;
    if (!announce || !changed) return;
    const detail = { preference, resolved };
    subscribers.forEach(listener => {
      try { listener(detail); } catch (_) { /* A subscriber cannot interrupt theme updates. */ }
    });
    if (typeof root.dispatchEvent === 'function' && typeof root.CustomEvent === 'function') {
      root.dispatchEvent(new root.CustomEvent('cr-theme-change', { detail }));
    }
  }

  root.CRTheme = Object.freeze({
    getPreference: () => preference,
    getResolved: () => resolved,
    setPreference(value) {
      if (!choices.has(value)) return false;
      preference = value;
      try { root.localStorage.setItem(STORAGE_KEY, preference); } catch (_) { /* Keep the in-memory choice. */ }
      apply();
      return true;
    },
    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    }
  });

  function followSystem() {
    if (preference === 'system') apply();
  }
  if (media) {
    if (typeof media.addEventListener === 'function') media.addEventListener('change', followSystem);
    else if (typeof media.addListener === 'function') media.addListener(followSystem);
  }

  if (typeof root.addEventListener === 'function') {
    root.addEventListener('storage', event => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      // Ignore another storage area (for example sessionStorage).
      if (event.storageArea) {
        try { if (event.storageArea !== root.localStorage) return; } catch (_) { return; }
      }
      preference = event.key === null ? 'system' : normalize(event.newValue);
      apply();
    });
  }

  apply(false);
})(window);
