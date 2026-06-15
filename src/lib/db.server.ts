import { Pool } from '@neondatabase/serverless';

const connectionString = process.env.VITE_NEON_DATABASE_URL || process.env.DATABASE_URL || '';

export const pool = new Pool({ connectionString });

export async function initializeUser(userId: string) {
  if (!connectionString) {
    console.warn('VITE_NEON_DATABASE_URL is not defined. Skipping DB initialization.');
    return;
  }
  const query = `
    INSERT INTO users (id) 
    VALUES ($1) 
    ON CONFLICT (id) DO NOTHING;
  `;
  await pool.query(query, [userId]);
}

export async function logUserActivity(userId: string, moduleName: string, actionType: string, payload: any) {
  if (!connectionString) {
    console.warn('VITE_NEON_DATABASE_URL not set. Skipping activity log.');
    return;
  }
  await pool.query(
    `INSERT INTO user_activity_logs (user_id, module_name, action_type, payload)
     VALUES ($1, $2, $3, $4)`,
    [userId, moduleName, actionType, JSON.stringify(payload)]
  );
}

export async function fetchUserActivityLogs(userId: string, moduleName: string) {
  if (!connectionString) {
    console.warn('VITE_NEON_DATABASE_URL not set. Skipping activity fetch.');
    return [];
  }
  const res = await pool.query(
    `SELECT id, action_type, payload, created_at FROM user_activity_logs 
     WHERE user_id = $1 AND module_name = $2 
     ORDER BY created_at DESC`,
    [userId, moduleName]
  );
  return res.rows.map(row => ({
    id: row.id,
    action_type: row.action_type,
    payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
    created_at: row.created_at
  }));
}
