import { Client } from "pg";
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
const r = await client.query('SELECT id, email, est_admin, actif FROM utilisateurs');
console.log(JSON.stringify(r.rows, null, 2));
await client.end();
