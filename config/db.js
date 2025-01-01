// require('dotenv').config(); // Load environment variables from .env file
// const { Pool } = require('pg');

// const pool = new Pool({
//     user: process.env.PG_USER,
//     host: process.env.PG_HOST,
//     database: process.env.PG_DATABASE,
//     password: process.env.PG_PASSWORD,
//     port: process.env.PG_PORT,
// });

// module.exports = pool;

require('dotenv').config(); // Load environment variables from .env file
const { Pool } = require('pg');

// Set up the connection pool
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false, // Enable SSL if PG_SSL is true
});

module.exports = pool;
