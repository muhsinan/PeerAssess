import { Pool } from 'pg';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'muhsinan',
  host: process.env.DB_HOST || '95.8.132.203',
  database: process.env.DB_NAME || 'peerassessdb',
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