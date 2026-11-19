/**
 * Saheb Paper ERP — Supabase Health Check & Uptime Ping Bot
 * Checks Supabase REST connectivity and measures latency.
 */

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || 'https://scyiwfqkknuphzhvklok.supabase.co').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjeWl3ZnFra251cGh6aHZrbG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2OTI1NjgsImV4cCI6MjEwNDI2ODU2OH0.uSIcsebYEW2uIgn_E6__Y2jg9te2NSHLMl3liZp3qmw';

async function checkHealth() {
  const startTime = Date.now();
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=count`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Range: '0-0',
      },
    });

    const duration = Date.now() - startTime;
    if (res.ok) {
      console.log(`✅ [UPTIME OK] Supabase response time: ${duration}ms (Status: ${res.status})`);
      process.exit(0);
    } else {
      console.error(`❌ [UPTIME ERROR] Supabase responded with status: ${res.status}`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ [UPTIME FAILED] Connection error:`, err.message);
    process.exit(1);
  }
}

checkHealth();
