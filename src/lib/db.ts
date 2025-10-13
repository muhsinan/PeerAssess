import { Pool } from 'pg';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'peerassess_user',
  host: process.env.DB_HOST || '192.168.3.8',
  database: process.env.DB_NAME || 'peerassess_local',
  password: process.env.DB_PASSWORD || '1516',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Test the connection when the module is imported
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

export default pool; 