const sequelize = require("../config/db"); // Your database connection config
const defineAssociations = require("../models/associations"); // The associations file

// --- Manually Import All Models ---
// This ensures the script is self-contained and not dependent on a potentially problematic index file.
const models = {
  Company: require("../models/Company"),
  User: require("../models/User"),
  Plan: require("../models/Plan"),
  Customer: require("../models/Customer"),
  CustomerHardware: require("../models/CustomerHardware"),
  Subscription: require("../models/Subscription"),
  Invoice: require("../models/Invoice"),
  Payment: require("../models/Payment"),
  Feature: require("../models/Feature"),
  UserPermission: require("../models/UserPermission"),
  Area: require("../models/Area"),
};

// --- Manually Define Associations ---
// This step is crucial to ensure the sequelize instance is fully aware of all relationships.
defineAssociations(models);

// --- Helper Functions for Data Generation ---
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const firstNames = [
  "John",
  "Jane",
  "Peter",
  "Alice",
  "Bob",
  "Charlie",
  "Diana",
  "Eve",
  "Frank",
  "Grace",
  "Heidi",
  "Ivan",
  "Judy",
  "Mallory",
  "Oscar",
];
const lastNames = [
  "Doe",
  "Smith",
  "Jones",
  "Williams",
  "Brown",
  "Davis",
  "Miller",
  "Wilson",
  "Moore",
  "Taylor",
  "Anderson",
  "Thomas",
  "Jackson",
  "White",
];
const domains = ["example.com", "email.net", "web.org"];
const streetNames = ["Oak", "Pine", "Maple", "Cedar", "Elm", "Birch"];
const streetTypes = ["St", "Ave", "Blvd", "Ln", "Dr"];
const deviceTypes = [
  "Router",
  "Modem",
  "Optical Network Terminal",
  "Set-top Box",
];

const generateMAC = () =>
  `00:1B:44:${randomInt(11, 99)}:${randomInt(11, 99)}:${randomInt(11, 99)}`;

const seedDatabase = async () => {
  try {
    console.log("Syncing database and dropping all tables...");
    await sequelize.sync({ force: true });
    console.log("Database synced and all tables dropped!");

    // --- 1. Create Features ---
    console.log("Seeding Features...");
    const features = await models.Feature.bulkCreate([
      {
        code: "admin.dashboard.view",
        name: "View Admin Dashboard",
        module: "Dashboard",
      },
      {
        code: "superadmin.dashboard.view",
        name: "View Super Admin Dashboard",
        module: "Dashboard",
      },
      { code: "agent.manage", name: "Manage Agents", module: "Users" },
      { code: "plan.manage", name: "Manage Plans", module: "Billing" },
      {
        code: "agent.dashboard.view",
        name: "View Agent Dashboard",
        module: "Dashboard",
      },
      {
        code: "collection.manage",
        name: "Manage Collections",
        module: "Billing",
      },
      { code: "customers.view", name: "View Customers", module: "Customers" },
      { code: "plans.view", name: "View Plans", module: "Plans" },
      { code: "agents.view", name: "View Agents", module: "Agents" },
      {
        code: "collection.view",
        name: "View Collection",
        module: "Collection",
      },
      { code: "reports.view", name: "View Reports", module: "Reports" },
      { code: "payments.view", name: "View Payments", module: "Payments" },
      { code: "customer.add", name: "Add Customer", module: "Customers" },
      { code: "customer.edit", name: "Edit Customer", module: "Customers" },
      {
        code: "customer.view.all",
        name: "View All Customers",
        module: "Customers",
      },
      {
        code: "customer.view.one",
        name: "View Single Customer",
        module: "Customers",
      },
      { code: "customer.delete", name: "Delete Customer", module: "Customers" },
    ]);
    const featureMap = features.reduce((map, feature) => {
      map[feature.code] = feature.id;
      return map;
    }, {});
    console.log("Features seeded.");

    // --- 2. Create Company ---
    console.log("Seeding Company...");
    const company = await models.Company.create({
      name: "Nexus Telecom",
      address: "123 Fiber Optic Lane, Network City",
    });
    console.log("Company seeded.");

    // --- 3. Create Users ---
    console.log("Seeding Users...");
    const superAdmin = await models.User.create({
      name: "Super Admin",
      email: "super@admin.com",
      phone: "0000000000",
      passwordHash: "supersecret123",
      role: "SUPER_ADMIN",
      companyId: null,
    });

    // --- 1b. Create Areas ---
    console.log("Seeding Areas...");
    const areaNames = [
      "North Zone",
      "South Zone",
      "East Zone",
      "West Zone",
      "Central Zone",
    ];
    const areasData = areaNames.map((name) => ({
      areaName: name,
      companyId: company.id,
      createdBy: superAdmin.id,
    }));
    const areas = await models.Area.bulkCreate(areasData);
    console.log("Areas seeded.");

    const admins = [];
    for (let i = 1; i <= 5; i++) {
      const name = `Admin User ${i}`;
      admins.push(
        await models.User.create({
          name,
          email: `admin${i}@nexustelecom.com`,
          phone: `111111111${i}`,
          passwordHash: "adminpass123",
          role: "ADMIN",
          companyId: company.id,
        })
      );
    }

    const agents = [];
    for (let i = 1; i <= 15; i++) {
      const name = `Agent User ${i}`;
      agents.push(
        await models.User.create({
          name,
          email: `agent${i}@nexustelecom.com`,
          phone: `222222222${i.toString().padStart(2, "0")}`,
          passwordHash: "agentpass123",
          role: "AGENT",
          companyId: company.id,
        })
      );
    }
    console.log("Users seeded.");

    // --- 4. Grant Permissions ---
    console.log("Granting Permissions...");
    const permissions = [];
    features.forEach((f) =>
      permissions.push({ userId: superAdmin.id, featureId: f.id })
    );
    admins.forEach((admin) => {
      permissions.push({
        userId: admin.id,
        featureId: featureMap["admin.dashboard.view"],
      });
      permissions.push({
        userId: admin.id,
        featureId: featureMap["agent.manage"],
      });
      permissions.push({
        userId: admin.id,
        featureId: featureMap["plan.manage"],
      });
      permissions.push({
        userId: admin.id,
        featureId: featureMap["customer.add"],
      });
      permissions.push({
        userId: admin.id,
        featureId: featureMap["customer.edit"],
      });
      permissions.push({
        userId: admin.id,
        featureId: featureMap["customer.view.all"],
      });
    });
    agents.forEach((agent) => {
      permissions.push({
        userId: agent.id,
        featureId: featureMap["agent.dashboard.view"],
      });
      permissions.push({
        userId: agent.id,
        featureId: featureMap["collection.manage"],
      });
      permissions.push({
        userId: agent.id,
        featureId: featureMap["customer.view.one"],
      });
    });
    await models.UserPermission.bulkCreate(permissions);
    console.log("Permissions granted.");

    // --- 5. Create Plans ---
    console.log("Seeding Plans...");
    const plans = await models.Plan.bulkCreate([
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
      {
        companyId: company.id,
        name: "Pro 500Mbps",
        monthlyPrice: 1499,
        code: "NEX-PRO500",
      },
      {
        companyId: company.id,
        name: "Gigabit 1Gbps",
        monthlyPrice: 2499,
        code: "NEX-G1000",
      },
    ]);
    console.log("Plans seeded.");

    // --- 6. Create Customers and related data in a loop ---
    console.log(
      "Seeding Customers, Subscriptions, Hardware, Invoices, and Payments..."
    );
    const customersData = [];
    for (let i = 1; i <= 30; i++) {
      const firstName = getRandomItem(firstNames);
      const lastName = getRandomItem(lastNames);
      customersData.push({
        companyId: company.id,
        fullName: `${firstName} ${lastName}`,
        phone: `33333333${i.toString().padStart(2, "0")}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${getRandomItem(
          domains
        )}`,
        address: `${randomInt(100, 9999)} ${getRandomItem(
          streetNames
        )} ${getRandomItem(streetTypes)}`,
        customerCode: `CUST-${i.toString().padStart(4, "0")}`,
        assignedAgentId: getRandomItem(agents).id,
        createdBy: getRandomItem(admins).id,
        installationDate: new Date(),
        areaId: getRandomItem(areas).id,
      });
    }
    const customers = await models.Customer.bulkCreate(customersData);

    const hardwareData = [];
    const paymentsData = [];

    for (const customer of customers) {
      hardwareData.push({
        customerId: customer.id,
        deviceType: getRandomItem(deviceTypes),
        macAddress: generateMAC(),
      });
      if (Math.random() > 0.5)
        hardwareData.push({
          customerId: customer.id,
          deviceType: getRandomItem(deviceTypes),
          macAddress: generateMAC(),
        });

      const plan = getRandomItem(plans);
      const createdSub = await models.Subscription.create({
        companyId: company.id,
        customerId: customer.id,
        planId: plan.id,
        startDate: new Date(),
      });

      const invoiceCount = randomInt(1, 3);
      for (let j = 0; j < invoiceCount; j++) {
        const amount = plan.monthlyPrice;
        const tax = amount * 0.18;
        const total = amount + tax;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15 - j * 30);
        const isPaid = Math.random() > 0.3;

        const createdInvoice = await models.Invoice.create({
          companyId: company.id,
          customerId: customer.id,
          subscriptionId: createdSub.id,
          periodStart: new Date(),
          periodEnd: new Date(),
          amountDue: amount,
          taxAmount: tax,
          amountTotal: total,
          dueDate: dueDate,
          status: isPaid
            ? "PAID"
            : dueDate < new Date()
            ? "OVERDUE"
            : "PENDING",
        });

        if (isPaid) {
          paymentsData.push({
            companyId: company.id,
            invoiceId: createdInvoice.id,
            collectedBy: customer.assignedAgentId,
            collectedAt: new Date(),
            method: getRandomItem(["UPI", "CASH"]),
            amount: total,
          });
        }
      }
    }

    await models.CustomerHardware.bulkCreate(hardwareData);
    await models.Payment.bulkCreate(paymentsData);

    console.log("All data seeded.");
    console.log("\n✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Failed to seed database:", error);
  } finally {
    await sequelize.close();
  }
};

seedDatabase();
