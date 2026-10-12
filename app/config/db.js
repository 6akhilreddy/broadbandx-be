const { Sequelize } = require("sequelize");
require("dotenv").config();

let sequelize;

console.log("Environment:", process.env.ENVIRONMENT);

if (process.env.ENVIRONMENT === "local") {
  // Local Database Connection
  sequelize = new Sequelize({
    database: "postgres", // Specify the database name
    username: "akhil", // Use your created admin user
    host: "127.0.0.1",
    dialect: "postgres", // Explicitly specify the dialect
    logging: false,
  });
} else if (process.env.ENVIRONMENT === "dev" || process.env.DB_URL) {
  // Neon DB Connection
  if (!process.env.DB_URL) {
    throw new Error("DB_URL environment variable is required for dev environment");
  }
  sequelize = new Sequelize(process.env.DB_URL, {
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Required for Neon DB
      },
    },
    logging: false,
  });
} else {
  // Fallback Local Database Connection
  sequelize = new Sequelize({
    database: process.env.DB_NAME || "postgres",
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || undefined,
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: "postgres",
    logging: false,
  });
}

module.exports = sequelize;
