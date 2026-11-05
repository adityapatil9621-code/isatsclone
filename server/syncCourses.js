import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, testConnection } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, '..', 'src', 'data', 'coursesData.sql');

try {
  const connection = await testConnection();
  console.log(`Connected to PostgreSQL database "${connection.database}" as "${connection.user}".`);

  const sql = await fs.readFile(sqlPath, 'utf8');
  await pool.query(sql);

  const result = await pool.query(`
    SELECT id, category, name
    FROM courses
    ORDER BY CASE category
      WHEN 'aesthetics' THEN 1
      WHEN 'trichology' THEN 2
      WHEN 'clinical_aesthetics' THEN 3
      ELSE 4
    END, name;
  `);

  console.log(`Course sync complete. ${result.rowCount} course records are now in PostgreSQL:`);
  for (const row of result.rows) console.log(`- ${row.id} | ${row.category} | ${row.name}`);
} catch (error) {
  console.error('\nCourse sync failed.');
  console.error(error.message);
  console.error('\nCheck your .env PostgreSQL settings and make sure PostgreSQL is running.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
