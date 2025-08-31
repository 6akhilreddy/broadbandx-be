require("pg");
// Import required modules
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./app/config/db");
const authRoutes = require("./app/routes/authRoutes");
const adminRoutes = require("./app/routes/adminRoutes");
const companyRoutes = require("./app/routes/companyRoutes");
const customerRoutes = require("./app/routes/customerRoutes");
const planRoutes = require("./app/routes/planRoutes");
const agentRoutes = require("./app/routes/agentRoutes");
const areaRoutes = require("./app/routes/areaRoutes");
const collectionRoutes = require("./app/routes/collectionRoutes");
const paymentRoutes = require("./app/routes/paymentRoutes");
const reportRoutes = require("./app/routes/reportRoutes");
const dashboardRoutes = require("./app/routes/dashboardRoutes");
const transactionRoutes = require("./app/routes/transactionRoutes");
const pendingChargeRoutes = require("./app/routes/pendingChargeRoutes");
const { swaggerUi, swaggerSpec } = require("./app/config/swagger");

// Initialize Express app
const app = express();
app.use(express.json());

// Enable CORS for all origins
app.use(cors());

// Test the database connection on startup instead of syncing.
sequelize
  .authenticate()
  .then(() =>
    console.log("Database connection has been established successfully. ✅")
  )
  .catch((err) => console.error("Unable to connect to the database: ❌", err));

// Swagger UI
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/areas", areaRoutes);
app.use("/api/collection", collectionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/pending-charges", pendingChargeRoutes);

// Start server
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>App Status</title>
      </head>
      <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
        <h1>🚀 App is working!</h1>
        <p>Server is running on port ${PORT}</p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Export for Vercel
module.exports = app;
