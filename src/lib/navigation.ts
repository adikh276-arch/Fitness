declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

/**
 * Centrally preserves active URL query parameters (service, upa_id, uid, etc.)
 * when navigating to a new path or route.
 */
export const preserveQueryParams = (targetPath: string): string => {
  if (typeof window === 'undefined' || !window.location) {
    return targetPath;
  }

  const [pathname, targetQuery] = targetPath.split('?');
  const currentParams = new URLSearchParams(window.location.search || '');

  // Normalize legacy 'source' param to 'service'
  if (currentParams.has('source')) {
    const val = currentParams.get('source');
    if (val && !currentParams.has('service')) {
      currentParams.set('service', val);
    }
    currentParams.delete('source');
  }

  // Fallback to cached upa_id from sessionStorage if missing
  if (!currentParams.has('upa_id')) {
    try {
      const cachedUpa = sessionStorage.getItem('fit_upa_id') || sessionStorage.getItem('upa_id');
      if (cachedUpa) currentParams.set('upa_id', cachedUpa);
    } catch {
      // ignore storage access errors
    }
  }

  if (targetQuery) {
    const targetParams = new URLSearchParams(targetQuery);
    targetParams.forEach((value, key) => {
      if (key === 'source') {
        currentParams.set('service', value);
      } else {
        currentParams.set(key, value);
      }
    });
  }

  const mergedSearch = currentParams.toString();
  return mergedSearch ? `${pathname}?${mergedSearch}` : pathname;
};

/**
 * Centrally handles exit across all contexts:
 * 1. React Native WebView -> window.ReactNativeWebView.postMessage
 * 2. iframe inside web.mantracare.com -> window.parent.postMessage
 * 3. Localhost -> returns to local dashboard (/fitness)
 * 4. Standalone browser -> redirects to https://web.mantracare.com/tasks
 */
export function handleExit() {
  if (typeof window === 'undefined') return;

  // 1. React Native WebView
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        action: 'exit',
      })
    );
    return;
  }

  // 2. iframe inside web.mantracare.com
  if (window.parent !== window) {
    window.parent.postMessage(
      {
        action: 'exit',
      },
      'https://web.mantracare.com'
    );
    return;
  }

  // Localhost dev environment fallback
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.location.href = '/fitness';
    return;
  }

  // 3. Standalone browser
  window.location.href = 'https://web.mantracare.com/tasks';
}

/**
 * Backward-compatible alias for handleExit
 */
export const handleExternalExit = handleExit;

/**
 * Checks if the user entered from the Self Care dashboard.
 */
export const isOpenedFromDashboard = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    sessionStorage.getItem('fit_opened_from_dashboard') === 'true' ||
    (window.history.length > 1 && document.referrer.includes(window.location.host))
  );
};

/**
 * Centrally handles navigation after completion or back button:
 * - If opened from the Self Care dashboard -> routes back to dashboard ('/')
 * - If opened directly (deep link / standalone task) -> executes handleExit()
 */
export const handleExitOrDashboard = (router?: { push: (path: string) => void } | ((path: string) => void)) => {
  if (isOpenedFromDashboard()) {
    if (typeof router === 'function') {
      router('/');
    } else if (router && typeof router.push === 'function') {
      router.push('/');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/fitness';
    }
  } else {
    handleExit();
  }
};

/**
 * Handles back routing, delegating to onBackCallback or handleExitOrDashboard.
 */
export const goBack = (onBackCallback?: () => void, router?: { push: (path: string) => void } | ((path: string) => void)) => {
  if (onBackCallback) {
    onBackCallback();
  } else {
    handleExitOrDashboard(router);
  }
};

/**
 * Redirects back to Dashboard / Exit.
 */
export const goToDashboard = (router?: { push: (path: string) => void } | ((path: string) => void)) => {
  handleExitOrDashboard(router);
};
