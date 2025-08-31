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

const seedDatabase = async () => {
  try {
    console.log("Syncing database and dropping all tables...");
    await sequelize.sync({ force: true });
    console.log("Database synced and all tables dropped!");

    // Check what tables were created
    const [results] = await sequelize.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    );
    console.log(
      "Tables created:",
      results.map((r) => r.tablename)
    );

    // Create basic data
    console.log("Creating basic data...");

    // Create company
    const company = await Company.create({
      name: "Nexus Telecom",
      address: "123 Fiber Optic Lane, Network City",
    });
    console.log("Company created");

    // Create roles
    const superAdminRole = await Role.create({
      name: "Super Admin",
      code: "SUPER_ADMIN",
      description: "Full system access",
    });
    const adminRole = await Role.create({
      name: "Admin",
      code: "ADMIN",
      description: "Company-level access",
    });
    const agentRole = await Role.create({
      name: "Agent",
      code: "AGENT",
      description: "Field agent access",
    });
    console.log("Roles created");

    // Create super admin user
    const superAdmin = await User.create({
      name: "Super Admin",
      email: "super@admin.com",
      phone: "0000000000",
      passwordHash: "supersecret123",
      roleId: superAdminRole.id,
      companyId: null,
    });
    console.log("Super admin created");

    // Create areas
    const areas = await Area.bulkCreate([
      {
        areaName: "North Zone",
        companyId: company.id,
        createdBy: superAdmin.id,
      },
      {
        areaName: "South Zone",
        companyId: company.id,
        createdBy: superAdmin.id,
      },
      {
        areaName: "East Zone",
        companyId: company.id,
        createdBy: superAdmin.id,
      },
      {
        areaName: "West Zone",
        companyId: company.id,
        createdBy: superAdmin.id,
      },
      {
        areaName: "Central Zone",
        companyId: company.id,
        createdBy: superAdmin.id,
      },
    ]);
    console.log("Areas created");

    // Create admin users
    const admins = [];
    for (let i = 1; i <= 3; i++) {
      admins.push(
        await User.create({
          name: `Admin User ${i}`,
          email: `admin${i}@nexustelecom.com`,
          phone: `111111111${i}`,
          passwordHash: "adminpass123",
          roleId: adminRole.id,
          companyId: company.id,
        })
      );
    }
    console.log("Admins created");

    // Create agent users
    const agents = [];
    for (let i = 1; i <= 5; i++) {
      agents.push(
        await User.create({
          name: `Agent User ${i}`,
          email: `agent${i}@nexustelecom.com`,
          phone: `222222222${i}`,
          passwordHash: "agentpass123",
          roleId: agentRole.id,
          companyId: company.id,
        })
      );
    }
    console.log("Agents created");

    // Create plans
    const plans = await Plan.bulkCreate([
      {
        companyId: company.id,
        name: "Basic 50Mbps",
        monthlyPrice: 499,
        code: "NEX-B50",
      },
      {
        companyId: company.id,
        name: "Standard 100Mbps",
        monthlyPrice: 799,
        code: "NEX-S100",
      },
      {
        companyId: company.id,
        name: "Premium 300Mbps",
        monthlyPrice: 999,
        code: "NEX-P300",
      },
    ]);
    console.log("Plans created");

    // Create customers
    const customers = [];
    for (let i = 1; i <= 10; i++) {
      customers.push(
        await Customer.create({
          companyId: company.id,
          fullName: `Customer ${i}`,
          phone: `33333333${i.toString().padStart(2, "0")}`,
          email: `customer${i}@example.com`,
          address: `${100 + i} Main St`,
          customerCode: `CUST-${i.toString().padStart(4, "0")}`,
          assignedAgentId: agents[i % agents.length].id,
          createdBy: admins[i % admins.length].id,
          installationDate: new Date(),
          areaId: areas[i % areas.length].id,
        })
      );
    }
    console.log("Customers created");

    // Create subscriptions
    const subscriptions = [];
    for (const customer of customers) {
      const plan = plans[Math.floor(Math.random() * plans.length)];
      subscriptions.push(
        await Subscription.create({
          companyId: company.id,
          customerId: customer.id,
          planId: plan.id,
          startDate: new Date(),
        })
      );
    }
    console.log("Subscriptions created");

    // Create invoices
    const invoices = [];
    for (const subscription of subscriptions) {
      const plan = await Plan.findByPk(subscription.planId);
      const customer = await Customer.findByPk(subscription.customerId);

      // Create invoice for August 2025
      const invoice = await Invoice.create({
        companyId: company.id,
        customerId: customer.id,
        subscriptionId: subscription.id,
        periodStart: new Date(2025, 7, 1), // August 1
        periodEnd: new Date(2025, 7, 31), // August 31
        subtotal: plan.monthlyPrice,
        taxAmount: plan.monthlyPrice * 0.18,
        amountTotal: plan.monthlyPrice * 1.18,
        dueDate: new Date(2025, 7, 15), // August 15
        status: Math.random() > 0.3 ? "PAID" : "PENDING",
      });
      invoices.push(invoice);
    }
    console.log("Invoices created");

    // Create payments for paid invoices
    for (const invoice of invoices) {
      if (invoice.status === "PAID") {
        const customer = await Customer.findByPk(invoice.customerId);
        await Payment.create({
          companyId: company.id,
          invoiceId: invoice.id,
          collectedBy: customer.assignedAgentId,
          collectedAt: new Date(),
          method: ["UPI", "CASH", "BHIM"][Math.floor(Math.random() * 3)],
          amount: invoice.amountTotal,
        });
      }
    }
    console.log("Payments created");

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Failed to seed database:", error);
  } finally {
    await sequelize.close();
  }
};

seedDatabase();
