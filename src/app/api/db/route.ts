import { NextResponse } from 'next/server';
import { initializeUser, logUserActivity, fetchUserActivityLogs, pool } from '@/lib/db.server';

export async function POST(request: Request) {
  try {
    const { action, args } = await request.json();

    if (action === 'query') {
      const [text, params] = args;
      const res = await pool.query(text, params);
      return NextResponse.json({ success: true, result: { rows: res.rows } });
    }

    if (action === 'initializeUser') {
      const [userId] = args;
      await initializeUser(userId);
      return NextResponse.json({ success: true });
    }

    if (action === 'logUserActivity') {
      const [userId, moduleName, actionType, payload] = args;
      await logUserActivity(userId, moduleName, actionType, payload);
      return NextResponse.json({ success: true });
    }

    if (action === 'fetchUserActivityLogs') {
      const [userId, moduleName] = args;
      const data = await fetchUserActivityLogs(userId, moduleName);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('Database proxy API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
