// const mysql = require('mysql2');

// const pool = mysql.createPool({
//   host: process.env.RAILWAY_HOST,
//   port:  process.env.RAILWAY_PORT,
//   user: process.env.RAILWAY_USER,
//   password: process.env.RAILWAY_PASSWORD,
//   database: process.env.RAILWAY_DB,
//   waitForConnections: true,
//   connectionLimit: 10,
// });


// module.exports = pool.promise();


const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.VERCEL_HOST,
  port: process.env.VERCEL_PORT,
  user: process.env.VERCEL_USER,
  password: process.env.VERCEL_PASSWORD,
  database: process.env.VERCEL_DB,
  max: 10, 
  idleTimeoutMillis: 30000, 
  ssl: {
    rejectUnauthorized: false, // Allows SSL connection
  }
});

module.exports = pool;
