const { Client } = require('pg');
const c = new Client({
  connectionString: 'postgresql://postgres:Kkz8f53Tw10eU6ORk3AM@db.rjrgylhcpnijkfstvcza.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await c.connect();

  await c.query(`
    CREATE TABLE IF NOT EXISTS supreme_command_queue (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      command TEXT NOT NULL,
      command_type TEXT NOT NULL DEFAULT 'query',
      reason TEXT,
      priority TEXT NOT NULL DEFAULT 'normal',
      status TEXT NOT NULL DEFAULT 'pending',
      source TEXT NOT NULL DEFAULT 'ai_agent',
      result TEXT,
      expires_at TIMESTAMPTZ,
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await c.query(`
    CREATE TABLE IF NOT EXISTS supreme_ai_heartbeats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      status TEXT NOT NULL DEFAULT 'alive',
      metrics JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await c.query('CREATE INDEX IF NOT EXISTS idx_scq_status ON supreme_command_queue (status, created_at DESC)');
  await c.query('ALTER TABLE supreme_command_queue ENABLE ROW LEVEL SECURITY');
  await c.query('ALTER TABLE supreme_ai_heartbeats ENABLE ROW LEVEL SECURITY');

  // RLS policies
  await c.query(`
    DO $$ BEGIN
      CREATE POLICY "super_admin_read_queue" ON supreme_command_queue
        FOR SELECT USING (
          EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true)
        );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `);

  await c.query(`
    DO $$ BEGIN
      CREATE POLICY "super_admin_update_queue" ON supreme_command_queue
        FOR UPDATE USING (
          EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true)
        );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `);

  await c.query(`
    DO $$ BEGIN
      CREATE POLICY "super_admin_read_heartbeats" ON supreme_ai_heartbeats
        FOR SELECT USING (
          EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true)
        );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `);

  console.log('All tables and policies created successfully');
  await c.end();
}

run().catch(e => { console.error('ERROR:', e.message); c.end(); });
