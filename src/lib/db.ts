export function getSessionUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('user_id');
}

export const pool = {
  async query(text: string, params: any[] = []) {
    try {
      const response = await fetch('/fitness/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'query', args: [text, params] }),
      });
      if (!response.ok) {
        return { rows: [] };
      }
      const json = await response.json();
      return json.result || { rows: [] };
    } catch {
      return { rows: [] };
    }
  }
};

export async function initializeUser(userId: string) {
  try {
    await fetch('/fitness/api/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'initializeUser', args: [userId] }),
    });
  } catch {
    // Graceful offline fallback
  }
}

export async function logUserActivity(moduleName: string, actionType: string, payload: any) {
  const userId = getSessionUserId();
  if (!userId) return;
  try {
    await fetch('/fitness/api/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'logUserActivity', args: [userId, moduleName, actionType, payload] }),
    });
  } catch (e) {
    console.error('Failed to log user activity:', e);
  }
}

export async function fetchUserActivityLogs(moduleName: string): Promise<any[]> {
  const userId = getSessionUserId();
  if (!userId) return [];
  try {
    const res = await fetch('/fitness/api/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'fetchUserActivityLogs', args: [userId, moduleName] }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    console.error(`Failed to fetch user activity logs for module ${moduleName}:`, e);
    return [];
  }
}
