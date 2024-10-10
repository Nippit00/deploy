const mysql = require('mysql2');

const connectionConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD ,
  database: process.env.DB_DATABASE ,
};

const connectWithRetry = () => {
  const connection = mysql.createConnection(connectionConfig);
  connection.connect((error) => {
    if (error) {
      console.error('Error connecting to database:', error);
      setTimeout(connectWithRetry, 5000); // Retry after 5 seconds
    } else {
      console.log('Connected to database');
    }
  });

  return connection;
};

const connection = connectWithRetry();

module.exports = connection;
