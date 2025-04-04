require('dotenv').config(); // Load .env variables

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false, // Set to console.log to see SQL queries
  },
  test: {
    // ... configuration for test environment
  },
  production: {
    // ... configuration for production environment (use DATABASE_URL env var)
  },
};
