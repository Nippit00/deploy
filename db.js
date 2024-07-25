const mysql = require('mysql2');

// Create a connection pool
const pool = mysql.createPool({
  connectionLimit: 10, // Adjust as needed
  host: process.env.DB_HOST,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'EvaluationSheet',
});

// Promisify for async/await
const promisePool = pool.promise();

const connectWithRetry = () => {
  promisePool.getConnection()
    .then((connection) => {
      console.log('Connected to database');
      connection.release();
    })
    .catch((error) => {
      console.error('Error connecting to database:', error);
      setTimeout(connectWithRetry, 5000); // Retry after 5 seconds
    });
};

// Initial connection attempt
connectWithRetry();

module.exports = promisePool;
