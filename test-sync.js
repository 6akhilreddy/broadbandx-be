const sequelize = require("./app/config/db");

// Import models individually to avoid association issues
const Company = require("./app/models/Company");
const User = require("./app/models/User");
const Plan = require("./app/models/Plan");
const Customer = require("./app/models/Customer");
const CustomerHardware = require("./app/models/CustomerHardware");
const Subscription = require("./app/models/Subscription");
const Invoice = require("./app/models/Invoice");
const InvoiceItem = require("./app/models/InvoiceItem");
const Payment = require("./app/models/Payment");
const Transaction = require("./app/models/Transaction");
const PendingCharge = require("./app/models/PendingCharge");
const Feature = require("./app/models/Feature");
const Role = require("./app/models/Role");
const RolePermission = require("./app/models/RolePermission");
const Area = require("./app/models/Area");

async function testSync() {
  try {
    console.log("Testing database sync...");

    // Sync without associations first
    await sequelize.sync({ force: true });
    console.log("✅ Database synced successfully!");

    // Check what tables were created
    const [results] = await sequelize.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
    );
    console.log(
      "Tables created:",
      results.map((r) => r.tablename)
    );
  } catch (error) {
    console.error("❌ Sync failed:", error.message);
    console.error("Full error:", error);
  } finally {
    await sequelize.close();
  }
}

testSync();
