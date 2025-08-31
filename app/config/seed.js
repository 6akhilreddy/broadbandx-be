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
  InvoiceItem: require("../models/InvoiceItem"),
  Payment: require("../models/Payment"),
  Transaction: require("../models/Transaction"),
  PendingCharge: require("../models/PendingCharge"),
  Feature: require("../models/Feature"),
  Role: require("../models/Role"),
  RolePermission: require("../models/RolePermission"),
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

// Generate random date within a specific month
const generateRandomDateInMonth = (year, month) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const randomDay = randomInt(1, daysInMonth);
  const randomHour = randomInt(9, 18); // Business hours
  const randomMinute = randomInt(0, 59);

  return new Date(year, month - 1, randomDay, randomHour, randomMinute);
};

// Generate unique invoice number
const generateInvoiceNumber = (companyId, customerId, date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `INV-${companyId}-${customerId}-${year}${month}${day}-${randomInt(
    1000,
    9999
  )}`;
};

const seedDatabase = async () => {
  try {
    console.log("Syncing database and dropping all tables...");
    await sequelize.sync({ force: true });
    console.log("Database synced and all tables dropped!");

    // --- 1. Create Features ---
    console.log("Seeding Features...");
    const features = await models.Feature.bulkCreate([
      // Super Admin Features
      {
        code: "superadmin.dashboard.view",
        name: "View Super Admin Dashboard",
        module: "Dashboard",
      },
      {
        code: "company.manage",
        name: "Manage Companies",
        module: "Companies",
      },
      {
        code: "superadmin.users.manage",
        name: "Manage All Users",
        module: "Users",
      },

      // Admin Features
      {
        code: "admin.dashboard.view",
        name: "View Admin Dashboard",
        module: "Dashboard",
      },
      { code: "agent.manage", name: "Manage Agents", module: "Users" },
      { code: "plan.manage", name: "Manage Plans", module: "Billing" },
      { code: "customers.view", name: "View Customers", module: "Customers" },
      { code: "plans.view", name: "View Plans", module: "Plans" },
      { code: "agents.view", name: "View Agents", module: "Agents" },
      { code: "reports.view", name: "View Reports", module: "Reports" },
      { code: "payments.view", name: "View Payments", module: "Payments" },
      { code: "customer.add", name: "Add Customer", module: "Customers" },
      { code: "customer.edit", name: "Edit Customer", module: "Customers" },
      {
        code: "customer.view.all",
        name: "View All Customers",
        module: "Customers",
      },
      { code: "customer.delete", name: "Delete Customer", module: "Customers" },
      { code: "area.manage", name: "Manage Areas", module: "Areas" },
      {
        code: "subscription.manage",
        name: "Manage Subscriptions",
        module: "Billing",
      },
      { code: "invoice.manage", name: "Manage Invoices", module: "Billing" },

      // Agent Features
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
      {
        code: "collection.view",
        name: "View Collection",
        module: "Collection",
      },
      {
        code: "customer.view.one",
        name: "View Single Customer",
        module: "Customers",
      },
      { code: "payment.collect", name: "Collect Payments", module: "Payments" },
      {
        code: "customer.hardware.view",
        name: "View Customer Hardware",
        module: "Customers",
      },
    ]);
    const featureMap = features.reduce((map, feature) => {
      map[feature.code] = feature.id;
      return map;
    }, {});
    console.log("Features seeded.");

    // --- 2. Create Roles ---
    console.log("Seeding Roles...");
    const roles = await models.Role.bulkCreate([
      {
        name: "Super Admin",
        code: "SUPER_ADMIN",
        description: "Full system access with company management capabilities",
      },
      {
        name: "Admin",
        code: "ADMIN",
        description: "Company-level administrative access",
      },
      {
        name: "Agent",
        code: "AGENT",
        description: "Field agent with customer and collection access",
      },
    ]);

    const roleMap = roles.reduce((map, role) => {
      map[role.code] = role.id;
      return map;
    }, {});
    console.log("Roles seeded.");

    // --- 3. Create Company ---
    console.log("Seeding Company...");
    const company = await models.Company.create({
      name: "Nexus Telecom",
      address: "123 Fiber Optic Lane, Network City",
    });
    console.log("Company seeded.");

    // --- 4. Create Users ---
    console.log("Seeding Users...");
    const superAdmin = await models.User.create({
      name: "Super Admin",
      email: "super@admin.com",
      phone: "0000000000",
      passwordHash: "supersecret123",
      roleId: roleMap["SUPER_ADMIN"],
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
          roleId: roleMap["ADMIN"],
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
          roleId: roleMap["AGENT"],
          companyId: company.id,
        })
      );
    }
    console.log("Users seeded.");

    // --- 5. Grant Permissions ---
    console.log("Granting Permissions...");
    const rolePermissions = [];

    // Super Admin gets all features
    features.forEach((f) =>
      rolePermissions.push({ roleId: roleMap["SUPER_ADMIN"], featureId: f.id })
    );

    // Admin gets all features except super admin features
    const adminFeatures = features.filter(
      (f) =>
        !f.code.startsWith("superadmin.") &&
        !f.code.startsWith("company.manage")
    );
    adminFeatures.forEach((f) =>
      rolePermissions.push({ roleId: roleMap["ADMIN"], featureId: f.id })
    );

    // Agent gets limited features
    const agentFeatureCodes = [
      "agent.dashboard.view",
      "collection.manage",
      "collection.view",
      "customer.view.one",
      "customer.add",
      "payment.collect",
      "customer.hardware.view",
    ];
    agentFeatureCodes.forEach((code) => {
      if (featureMap[code]) {
        rolePermissions.push({
          roleId: roleMap["AGENT"],
          featureId: featureMap[code],
        });
      }
    });

    await models.RolePermission.bulkCreate(rolePermissions);
    console.log("Permissions granted.");

    // --- 6. Create Plans ---
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

    // --- 7. Create Customers and related data in a loop ---
    console.log(
      "Seeding Customers, Subscriptions, Hardware, Invoices, InvoiceItems, Payments, Transactions, and PendingCharges..."
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
    const invoicesData = [];
    const invoiceItemsData = [];
    const transactionsData = [];
    const pendingChargesData = [];

    // Create hardware for customers
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
    }

    // Create subscriptions and invoices for customers
    for (const customer of customers) {
      const plan = getRandomItem(plans);
      const createdSub = await models.Subscription.create({
        companyId: company.id,
        customerId: customer.id,
        planId: plan.id,
        startDate: new Date(),
      });

      // Create invoices for the last 3 months
      const months = [6, 7, 8]; // June, July, August
      for (const month of months) {
        const year = 2025;
        const periodStart = new Date(year, month - 1, 1);
        const periodEnd = new Date(year, month, 0);
        const dueDate = new Date(year, month - 1, 15);

        const amount = plan.monthlyPrice;
        const tax = amount * 0.18;
        const total = amount + tax;

        // 70% chance of being paid
        const isPaid = Math.random() > 0.3;

        const invoiceDate = new Date(year, month - 1, 1);
        const invoiceNumber = generateInvoiceNumber(
          company.id,
          customer.id,
          invoiceDate
        );

        const createdInvoice = await models.Invoice.create({
          companyId: company.id,
          customerId: customer.id,
          subscriptionId: createdSub.id,
          periodStart: periodStart,
          periodEnd: periodEnd,
          subtotal: amount,
          taxAmount: tax,
          discounts: 0,
          amountTotal: total,
          dueDate: dueDate,
          status: isPaid
            ? "PAID"
            : dueDate < new Date()
            ? "OVERDUE"
            : "PENDING",
          invoiceNumber: invoiceNumber,
          notes: `Monthly internet service for ${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`,
          isActive: true,
        });

        // Create invoice items for this invoice
        const internetServiceItem = {
          invoiceId: createdInvoice.id,
          itemType: "INTERNET_SERVICE",
          description: `${plan.name} - Monthly Service`,
          quantity: 1,
          unitPrice: amount,
          totalAmount: amount,
          isActive: true,
        };
        invoiceItemsData.push(internetServiceItem);

        // Add some additional items for some invoices
        if (Math.random() > 0.7) {
          // 30% chance of having router installation
          const routerInstallationItem = {
            invoiceId: createdInvoice.id,
            itemType: "ROUTER_INSTALLATION",
            description: "Router Installation Service",
            quantity: 1,
            unitPrice: 500,
            totalAmount: 500,
            isActive: true,
          };
          invoiceItemsData.push(routerInstallationItem);
        }

        if (Math.random() > 0.8) {
          // 20% chance of having late fee
          const lateFeeItem = {
            invoiceId: createdInvoice.id,
            itemType: "LATE_FEE",
            description: "Late Payment Fee",
            quantity: 1,
            unitPrice: 100,
            totalAmount: 100,
            isActive: true,
          };
          invoiceItemsData.push(lateFeeItem);
        }

        if (isPaid) {
          // Generate random collection dates within the month
          const collectionDate = generateRandomDateInMonth(year, month);
          const payment = {
            companyId: company.id,
            invoiceId: createdInvoice.id,
            collectedBy: customer.assignedAgentId,
            collectedAt: collectionDate,
            method: getRandomItem(["UPI", "CASH", "BHIM", "PhonePe", "CARD"]),
            amount: total,
            comments: `Payment collected for invoice ${invoiceNumber}`,
          };
          paymentsData.push(payment);

          // Create transaction record for this payment
          const transaction = {
            companyId: company.id,
            customerId: customer.id,
            type: "PAYMENT",
            amount: total,
            balanceBefore: 0, // This would be calculated in real scenario
            balanceAfter: 0, // This would be calculated in real scenario
            description: `Payment received for invoice ${invoiceNumber}`,
            referenceId: createdInvoice.id,
            referenceType: "invoice",
            transactionDate: collectionDate,
            recordedDate: collectionDate,
            createdBy: customer.assignedAgentId,
            isActive: true,
          };
          transactionsData.push(transaction);
        } else {
          // Create bill generation transaction
          const billGenerationTransaction = {
            companyId: company.id,
            customerId: customer.id,
            type: "BILL_GENERATION",
            amount: total,
            balanceBefore: 0,
            balanceAfter: total,
            description: `Bill generated for invoice ${invoiceNumber}`,
            referenceId: createdInvoice.id,
            referenceType: "invoice",
            transactionDate: invoiceDate,
            recordedDate: invoiceDate,
            createdBy: getRandomItem(admins).id,
            isActive: true,
          };
          transactionsData.push(billGenerationTransaction);
        }
      }

      // Create some pending charges for customers
      if (Math.random() > 0.6) {
        // 40% chance of having pending charges
        const pendingChargeTypes = [
          "ROUTER_INSTALLATION",
          "EQUIPMENT_CHARGE",
          "LATE_FEE",
          "ADJUSTMENT",
          "OTHER",
        ];
        const chargeType = getRandomItem(pendingChargeTypes);

        const pendingCharge = {
          companyId: company.id,
          customerId: customer.id,
          chargeType: chargeType,
          description: `${chargeType
            .replace("_", " ")
            .toLowerCase()} charge for ${customer.fullName}`,
          amount: randomInt(100, 1000),
          isApplied: Math.random() > 0.7, // 30% chance of being applied
          appliedToInvoiceId: null, // Will be set if applied
          appliedDate: null,
          createdBy: getRandomItem(admins).id,
          isActive: true,
        };
        pendingChargesData.push(pendingCharge);
      }
    }

    await models.CustomerHardware.bulkCreate(hardwareData);
    await models.InvoiceItem.bulkCreate(invoiceItemsData);
    await models.Payment.bulkCreate(paymentsData);
    await models.Transaction.bulkCreate(transactionsData);
    await models.PendingCharge.bulkCreate(pendingChargesData);

    // Add additional collection data for August with more realistic patterns
    console.log("Adding additional August collection data...");

    // Create some additional invoices and payments for August with different patterns
    const augustCustomers = customers.slice(0, 15); // Use first 15 customers for additional data

    for (const customer of augustCustomers) {
      const plan = getRandomItem(plans);

      // Create additional invoices for August with different due dates
      const augustDates = [1, 5, 10, 15, 20, 25, 28, 30]; // Specific dates in August

      for (const day of augustDates) {
        if (Math.random() > 0.4) {
          // 60% chance of having payment on this date
          const periodStart = new Date(2025, 7, 1); // August 1
          const periodEnd = new Date(2025, 7, 31); // August 31
          const dueDate = new Date(2025, 7, 15); // August 15

          const amount = plan.monthlyPrice;
          const tax = amount * 0.18;
          const total = amount + tax;

          // Find the subscription for this customer
          const subscription = await models.Subscription.findOne({
            where: { customerId: customer.id },
          });

          const invoiceDate = new Date(2025, 7, 1);
          const invoiceNumber = generateInvoiceNumber(
            company.id,
            customer.id,
            invoiceDate
          );

          const createdInvoice = await models.Invoice.create({
            companyId: company.id,
            customerId: customer.id,
            subscriptionId: subscription.id,
            periodStart: periodStart,
            periodEnd: periodEnd,
            subtotal: amount,
            taxAmount: tax,
            discounts: 0,
            amountTotal: total,
            dueDate: dueDate,
            status: "PAID",
            invoiceNumber: invoiceNumber,
            notes: `Additional August invoice for ${customer.fullName}`,
            isActive: true,
          });

          // Create invoice item
          await models.InvoiceItem.create({
            invoiceId: createdInvoice.id,
            itemType: "INTERNET_SERVICE",
            description: `${plan.name} - Monthly Service`,
            quantity: 1,
            unitPrice: amount,
            totalAmount: amount,
            isActive: true,
          });

          // Create payment on the specific date
          const collectionDate = new Date(
            2025,
            7,
            day,
            randomInt(9, 18),
            randomInt(0, 59)
          );

          const payment = await models.Payment.create({
            companyId: company.id,
            invoiceId: createdInvoice.id,
            collectedBy: customer.assignedAgentId,
            collectedAt: collectionDate,
            method: getRandomItem(["UPI", "CASH", "BHIM", "PhonePe", "CARD"]),
            amount: total,
            comments: `Additional August payment for invoice ${invoiceNumber}`,
          });

          // Create transaction for this payment
          await models.Transaction.create({
            companyId: company.id,
            customerId: customer.id,
            type: "PAYMENT",
            amount: total,
            balanceBefore: 0,
            balanceAfter: 0,
            description: `Payment received for invoice ${invoiceNumber}`,
            referenceId: createdInvoice.id,
            referenceType: "invoice",
            transactionDate: collectionDate,
            recordedDate: collectionDate,
            createdBy: customer.assignedAgentId,
            isActive: true,
          });
        }
      }
    }

    console.log("All data seeded.");
    console.log("\n✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Failed to seed database:", error);
  } finally {
    await sequelize.close();
  }
};

seedDatabase();
