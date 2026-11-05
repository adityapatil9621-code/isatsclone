import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

export const pool = new Pool(config.pg);

export async function testConnection() {
  const result = await pool.query('SELECT current_database() AS database, current_user AS user');
  return result.rows[0];
}

export async function getCourses() {
  const result = await pool.query(`
    SELECT
      id,
      category,
      name,
      duration,
      eligibility,
      syllabus,
      career_options,
      highlights,
      outcomes,
      who_can_enroll,
      curriculum
    FROM courses
    ORDER BY CASE category
      WHEN 'aesthetics' THEN 1
      WHEN 'trichology' THEN 2
      WHEN 'clinical_aesthetics' THEN 3
      ELSE 4
    END, name;
  `);
  return result.rows;
}

export async function getCourseById(id) {
  const result = await pool.query(`
    SELECT
      id,
      category,
      name,
      duration,
      eligibility,
      syllabus,
      career_options,
      highlights,
      outcomes,
      who_can_enroll,
      curriculum
    FROM courses
    WHERE id = $1
    LIMIT 1;
  `, [id]);
  return result.rows[0] || null;
}
