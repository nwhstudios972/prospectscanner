import { config } from "dotenv";
import { Client } from "pg";

config({ path: process.argv[2] || ".env", override: true });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL absente");

  const client = new Client({ connectionString });
  await client.connect();
  try {
    const users = await client.query(`
      SELECT id, email, est_admin, actif, date_creation
      FROM utilisateurs
      ORDER BY date_creation DESC
    `);
    const logins = await client.query(`
      SELECT email, adresse_ip, connecte_a, deconnecte_a, type_deconnexion
      FROM journal_connexions
      ORDER BY connecte_a DESC
      LIMIT 100
    `);
    const counts = await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM prospects) AS prospects,
        (SELECT COUNT(*)::int FROM scans) AS scans,
        (SELECT COUNT(*)::int FROM utilisateurs) AS utilisateurs
    `);
    const triggers = await client.query(`
      SELECT event_object_table AS table_name, trigger_name, action_timing, event_manipulation
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `);
    const routines = await client.query(`
      SELECT routine_name, routine_type, security_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      ORDER BY routine_name
    `);
    const publicTables = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    const apiPrivileges = await client.query(`
      SELECT grantee, table_name, privilege_type
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND grantee IN ('anon', 'authenticated', 'PUBLIC')
      ORDER BY grantee, table_name, privilege_type
    `);

    console.log(JSON.stringify({
      counts: counts.rows[0],
      users: users.rows,
      recentLogins: logins.rows,
      triggers: triggers.rows,
      routines: routines.rows,
      publicTables: publicTables.rows,
      apiPrivileges: apiPrivileges.rows,
    }, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Audit impossible:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
