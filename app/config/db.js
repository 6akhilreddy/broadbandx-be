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
} else if (process.env.ENVIRONMENT === "dev") {
  // Neon DB Connection
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
  // Local Database Connection
  sequelize = new Sequelize(
    "postgresql://neondb_owner:npg_rbIMWjP91puk@ep-noisy-water-a1ylr5o3-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    {
      dialect: "postgres",
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false, // Required for Neon DB
        },
      },
      logging: false,
    }
  );
}

module.exports = sequelize;
