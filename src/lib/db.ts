import { Pool } from '@neondatabase/serverless';

// Ensure to add this connection string in your Docker environment variables:
// VITE_NEON_DATABASE_URL="postgres://user:password@endpoint.neon.tech/dbname"
const connectionString = import.meta.env.VITE_NEON_DATABASE_URL || '';

export const pool = new Pool({ connectionString });

/**
 * Initializes the user in the database.
 * If the user_id does not exist, it inserts a new record.
 * Ensure the table is configured as:
 * CREATE TABLE IF NOT EXISTS users (id BIGINT PRIMARY KEY);
 */
export async function initializeUser(userId: string) {
  if (!connectionString) {
    console.warn('VITE_NEON_DATABASE_URL is not defined. Skipping DB initialization.');
    return;
  }
  
  try {
    // 3. Database Persistence (neon)
    // The application must treat the user_id returned by the handshake as the source of truth.
    // If a record for this id does not exist in the users table, trigger an initial upsert.
    const query = `
      INSERT INTO users (id) 
      VALUES ($1) 
      ON CONFLICT (id) DO NOTHING;
    `;
    
    await pool.query(query, [userId]);
    console.log(`User ${userId} initialized successfully.`);
  } catch (error) {
    console.error('Failed to initialize user in Neon DB:', error);
    // Depending on requirements, we could throw here, but typically we want the app to proceed
    // even if the initial upsert fails due to network issues (or we could retry).
    throw error;
  }
}

/**
 * Helper to get the current authenticated user ID from session.
 * Used for RLS and subsequent queries to Neon to restrict data.
 */
export function getSessionUserId(): string | null {
  return sessionStorage.getItem('user_id');
}

/**
 * Logs any module activity to the user_activity_logs table.
 * Uses a JSONB payload to flexibly capture all module telemetry.
 */
export async function logUserActivity(moduleName: string, actionType: string, payload: any) {
  const userId = getSessionUserId();
  if (!userId) return;
  if (!connectionString) {
    console.warn('VITE_NEON_DATABASE_URL not set. Skipping activity log.');
    return;
  }
  try {
    await pool.query(
      `INSERT INTO user_activity_logs (user_id, module_name, action_type, payload)
       VALUES ($1, $2, $3, $4)`,
      [userId, moduleName, actionType, JSON.stringify(payload)]
    );
  } catch (e) {
    console.error('Failed to log user activity:', e);
  }
}

/**
 * Fetches logged module activity from the user_activity_logs table.
 * Returns parsed payload along with action_type and created_at timestamps.
 */
export async function fetchUserActivityLogs(moduleName: string): Promise<any[]> {
  const userId = getSessionUserId();
  if (!userId) return [];
  if (!connectionString) {
    console.warn('VITE_NEON_DATABASE_URL not set. Skipping activity fetch.');
    return [];
  }
  try {
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
  } catch (e) {
    console.error(`Failed to fetch user activity logs for module ${moduleName}:`, e);
    return [];
  }
}

