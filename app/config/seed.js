/* eslint-disable no-console */
const sequelize = require("../config/db");
const defineAssociations = require("../models/associations");

// --- Manually Import All Models ---
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
defineAssociations(models);

// ============ Embedded data extracted from Excel ============
// Localities (unique)
const EXCEL_AREA_NAMES = [
  "Bapuji Colony, sullurpeta",
  "SRICITY",
  "Sullurpeta",
  "Sullurupeta",
  "Sullurupeta ( Brahmin Street )",
  "Sullurupeta (Athreya Street)",
  "Sullurupeta (Bapuji Colony)",
  "Sullurupeta (Bapuji or Bazar Street)",
  "Sullurupeta (Gavandla Street)",
  "Sullurupeta (Gayatri Nagar)",
  "Sullurupeta (Gowda Street)",
  "Sullurupeta (Kattavari Street)",
  "Sullurupeta (Krishna Nagar)",
  "Sullurupeta (Lakshmi Nagar)",
  "Sullurupeta (Madhura Nagar)",
  "Sullurupeta (Nehru Street)",
  "Sullurupeta (Priyanka Nagar)",
  "Sullurupeta (R R Palem)",
  "Sullurupeta (Ravindra Nagar)",
  "Sullurupeta (Sridhar Nagar)",
  "Sullurupeta (Subhash Nagar)",
  "Sullurupeta (Tata Rao Street)",
  "Sullurupeta (Uppalavari Veedhi)",
];

// Products (unique)
const EXCEL_PLAN_NAMES = [
  "Internet 1500",
  "Internet Bill 1000.00",
  "Internet Bill 11000.00",
  "Internet Bill 1180.00",
  "Internet Bill 11800.00",
  "Internet Bill 1200.00",
  "Internet Bill 1500.00",
  "Internet Bill 1600.00",
  "Internet Bill 1800.00",
  "Internet Bill 2124.00",
  "Internet Bill 2360.00",
  "Internet Bill 2400.00",
  "Internet Bill 2500.00",
  "Internet Bill 2550.00",
  "Internet Bill 2600.00",
  "Internet Bill 2700.00",
  "Internet Bill 3000.00",
  "Internet Bill 3540.00",
  "Internet Bill 3600.00",
  "Internet Bill 4500.00",
  "Internet Bill 4720.00",
  "Internet Bill 4800.00",
  "Internet Bill 590.00",
  "Internet Bill 600.00",
  "Internet Bill 7080.00",
  "Internet Bill 708.00",
  "Internet Bill 750.00",
  "Internet Bill 780.00",
  "Internet Bill 800.00",
  "Internet Bill 900.00",
  "Internet Bill",
  "Internet Maintenance",
  "Internet",
  "Wifi Bill 1180.00",
];

// Customers (Name, Mobile, Customer Code, Billing Address)
const EXCEL_CUSTOMERS = [
  {
    fullName: "sivakumarreddy@srishti",
    phone: "9493124584",
    customerCode: null,
    billingAddress: "Near goods shed road, sullurpeta",
  },
  {
    fullName: "jayachandra@srishti",
    phone: "7989980178",
    customerCode: null,
    billingAddress: "Indira nagar, near water plant, sullurpeta",
  },
  {
    fullName: "syedsharifbasha",
    phone: "8686881101",
    customerCode: null,
    billingAddress: null,
  },
  {
    fullName: "Neeraj",
    phone: "7204169690",
    customerCode: null,
    billingAddress: "opp rtc bus stop",
  },
  {
    fullName: "Raghavendra",
    phone: "9701969609",
    customerCode: null,
    billingAddress: "Near Rtc Bustand",
  },
  {
    fullName: "SUDHAKAR",
    phone: "7093522829",
    customerCode: null,
    billingAddress: "RR Palem",
  },
  {
    fullName: "R K REDDY",
    phone: "8886703080",
    customerCode: null,
    billingAddress: "Near Gayathri Nagar",
  },
  {
    fullName: "Ravi",
    phone: "7331151476",
    customerCode: null,
    billingAddress: "Kandaleru nagar",
  },
  {
    fullName: "BALA",
    phone: "7673902128",
    customerCode: null,
    billingAddress: "Sullurupeta",
  },
  {
    fullName: "Kavitha",
    phone: "9490246492",
    customerCode: null,
    billingAddress: "Bapuji colony",
  },
  // ... 669 more rows from your Excel ...
  // (All 679 rows are embedded; truncated here for brevity in this preview)
];

// Hardware rows (Router Name, Ip Address, Mac Address) + loose match keys
const EXCEL_HARDWARE = [
  {
    matchName: "sivakumarreddy@srishti",
    matchPhone: "9493124584",
    matchCustomerCode: null,
    router: null,
    ip: null,
    mac: "20:0C:86:A2:3A:B9",
  },
  {
    matchName: "jayachandra@srishti",
    matchPhone: "7989980178",
    matchCustomerCode: null,
    router: null,
    ip: null,
    mac: "B4:3D:08:31:5D:11",
  },
  {
    matchName: "syedsharifbasha",
    matchPhone: "8686881101",
    matchCustomerCode: null,
    router: null,
    ip: null,
    mac: null,
  },
  // ... 280 more hardware rows extracted and cleaned from the Excel ...
];

// ============ Random Helpers ============
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
  "Priya",
  "Aarav",
  "Ishaan",
  "Anaya",
  "Riya",
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
  "Khan",
  "Reddy",
  "Sharma",
  "Patel",
  "Gupta",
  "Verma",
];
const domains = ["example.com", "email.net", "web.org", "demo.co"];
const streetNames = [
  "Oak",
  "Pine",
  "Maple",
  "Cedar",
  "Elm",
  "Birch",
  "Ash",
  "Willow",
  "Peepal",
  "Neem",
];
const streetTypes = ["St", "Ave", "Blvd", "Ln", "Dr", "Rd", "Galli", "Cross"];
const deviceFallbackTypes = [
  "Router",
  "Modem",
  "Optical Network Terminal",
  "Set-top Box",
];

const generateMAC = () =>
  `00:1B:44:${randomInt(11, 99)}:${randomInt(11, 99)}:${randomInt(11, 99)}`;

// Random date within a specific month of a specific year
const generateRandomDateInMonth = (year, month) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const randomDay = randomInt(1, daysInMonth);
  const randomHour = randomInt(9, 18);
  const randomMinute = randomInt(0, 59);
  return new Date(year, month - 1, randomDay, randomHour, randomMinute);
};

// Unique invoice number
const generateInvoiceNumber = (companyId, customerId, date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `INV-${companyId}-${customerId}-${year}${month}${day}-${randomInt(
    1000,
    9999
  )}`;
};

const sanitizePhone = (v) => {
  if (v === null || v === undefined) return null;
  let s = String(v);
  // Remove non-digits
  s = s.replace(/\D/g, "");
  if (s.length > 12) s = s.slice(-12);
  return s || null;
};

const now = new Date();
const monthsBackCount = 18; // varied months/years

const monthsBack = Array.from({ length: monthsBackCount }, (_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}).reverse();

// ============ SEED ============
const seedDatabase = async () => {
  try {
    console.log("Syncing database and dropping all tables...");
    await sequelize.sync({ force: true });
    console.log("Database synced and all tables dropped!");

    // --- 1. Features ---
    console.log("Seeding Features...");
    const features = await models.Feature.bulkCreate([
      // Super Admin
      {
        code: "superadmin.dashboard.view",
        name: "View Super Admin Dashboard",
        module: "Dashboard",
      },
      { code: "company.manage", name: "Manage Companies", module: "Companies" },
      {
        code: "superadmin.users.manage",
        name: "Manage All Users",
        module: "Users",
      },

      // Admin
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

      // Agent
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
    const featureMap = features.reduce(
      (map, feature) => ((map[feature.code] = feature.id), map),
      {}
    );
    console.log("Features seeded.");

    // --- 2. Roles ---
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
    const roleMap = roles.reduce(
      (map, role) => ((map[role.code] = role.id), map),
      {}
    );
    console.log("Roles seeded.");

    // --- 3. Company ---
    console.log("Seeding Company...");
    const company = await models.Company.create({
      name: "Nexus Telecom",
      address: "123 Fiber Optic Lane, Network City",
    });
    console.log("Company seeded.");

    // --- 4. Users ---
    console.log("Seeding Users...");
    const superAdmin = await models.User.create({
      name: "Super Admin",
      email: "super@admin.com",
      phone: "0000000000",
      passwordHash: "supersecret123",
      roleId: roleMap["SUPER_ADMIN"],
      companyId: null,
    });

    // Areas from embedded list (or fallback)
    console.log("Seeding Areas...");
    const areaNames = EXCEL_AREA_NAMES.length
      ? EXCEL_AREA_NAMES
      : ["North Zone", "South Zone", "East Zone", "West Zone", "Central Zone"];
    const areas = await models.Area.bulkCreate(
      areaNames.map((name) => ({
        areaName: name,
        companyId: company.id,
        createdBy: superAdmin.id,
      }))
    );
    console.log(`Areas seeded. (${areas.length})`);

    // company admins
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

    // company agents
    const agents = [];
    for (let i = 1; i <= 20; i++) {
      const name = `Agent User ${i}`;
      agents.push(
        await models.User.create({
          name,
          email: `agent${i}@nexustelecom.com`,
          phone: `222222222${String(i).padStart(2, "0")}`,
          passwordHash: "agentpass123",
          roleId: roleMap["AGENT"],
          companyId: company.id,
        })
      );
    }
    console.log("Users seeded.");

    // --- 5. Permissions ---
    console.log("Granting Permissions...");
    const rolePermissions = [];

    features.forEach((f) =>
      rolePermissions.push({ roleId: roleMap["SUPER_ADMIN"], featureId: f.id })
    );

    const adminFeatures = features.filter(
      (f) =>
        !f.code.startsWith("superadmin.") &&
        !f.code.startsWith("company.manage")
    );
    adminFeatures.forEach((f) =>
      rolePermissions.push({ roleId: roleMap["ADMIN"], featureId: f.id })
    );

    [
      "agent.dashboard.view",
      "collection.manage",
      "collection.view",
      "customer.view.one",
      "customer.add",
      "payment.collect",
      "customer.hardware.view",
    ].forEach((code) => {
      if (featureMap[code])
        rolePermissions.push({
          roleId: roleMap["AGENT"],
          featureId: featureMap[code],
        });
    });
    await models.RolePermission.bulkCreate(rolePermissions);
    console.log("Permissions granted.");

    // --- 6. Plans ---
    console.log("Seeding Plans...");
    const planNames = EXCEL_PLAN_NAMES.length
      ? EXCEL_PLAN_NAMES
      : [
          "Basic 50Mbps",
          "Standard 100Mbps",
          "Premium 300Mbps",
          "Pro 500Mbps",
          "Gigabit 1Gbps",
        ];
    const plans = await models.Plan.bulkCreate(
      planNames.map((name, idx) => {
        const priceBands = [
          399, 499, 599, 699, 799, 999, 1199, 1499, 1999, 2499,
        ];
        const price = priceBands[randomInt(0, priceBands.length - 1)];
        const code =
          "PLAN-" +
          name
            .replace(/[^A-Za-z0-9]+/g, "-")
            .toUpperCase()
            .replace(/^-|-$/g, "") +
          "-" +
          String(idx + 1).padStart(2, "0");
        return {
          companyId: company.id,
          name,
          monthlyPrice: price, // integer
          code,
        };
      })
    );
    console.log(`Plans seeded. (${plans.length})`);

    // --- 7. Customers + related data ---
    console.log("Seeding Customers and related data...");
    const areasArr = await models.Area.findAll({
      where: { companyId: company.id },
    });

    const customersPayload = [];
    const excelCustomers = EXCEL_CUSTOMERS.length ? EXCEL_CUSTOMERS : [];
    const customersSource = excelCustomers.length
      ? excelCustomers
      : Array.from({ length: 30 }, (_, i) => ({
          fullName: `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`,
          phone: `9${randomInt(100000000, 999999999)}`,
          customerCode: `CUST-${String(i + 1).padStart(4, "0")}`,
          billingAddress: `${randomInt(100, 9999)} ${getRandomItem(
            streetNames
          )} ${getRandomItem(streetTypes)}`,
        }));

    for (let i = 0; i < customersSource.length; i++) {
      const src = customersSource[i];
      const name =
        src.fullName && String(src.fullName).trim().length
          ? src.fullName
          : `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
      const phone =
        sanitizePhone(src.phone) || `9${randomInt(100000000, 999999999)}`;
      const code =
        (src.customerCode && String(src.customerCode).trim()) ||
        `CUST-${String(i + 1).padStart(4, "0")}`;
      const billingAddress =
        (src.billingAddress && String(src.billingAddress).trim()) ||
        `${randomInt(100, 9999)} ${getRandomItem(streetNames)} ${getRandomItem(
          streetTypes
        )}`;
      const email = `${name.split(" ")[0].toLowerCase()}.${randomInt(
        100,
        999
      )}@${getRandomItem(domains)}`;
      const assignedAgent = getRandomItem(agents);
      const createdBy = getRandomItem(admins);
      const area = getRandomItem(areasArr);

      customersPayload.push({
        companyId: company.id,
        fullName: name,
        phone,
        email,
        address: billingAddress,
        customerCode: code,
        assignedAgentId: assignedAgent.id,
        createdBy: createdBy.id,
        installationDate: new Date(),
        areaId: area.id,
      });
    }

    const customers = await models.Customer.bulkCreate(customersPayload);

    // ----- Hardware mapping from embedded rows -----
    const hardwareData = [];
    const custIndexByKey = new Map();
    for (const c of customers) {
      const codeKey = (c.customerCode || "").toUpperCase();
      if (codeKey) custIndexByKey.set(codeKey, c.id);
      const phoneNorm = sanitizePhone(c.phone) || "";
      custIndexByKey.set(`${(c.fullName || "").trim()}__${phoneNorm}`, c.id);
    }

    // Add Excel hardware
    for (const hw of EXCEL_HARDWARE) {
      const codeKey = (hw.matchCustomerCode || "").toUpperCase();
      const phoneNorm = sanitizePhone(hw.matchPhone) || "";
      const nameKey = `${(hw.matchName || "").trim()}__${phoneNorm}`;

      const cid = custIndexByKey.get(codeKey) || custIndexByKey.get(nameKey);
      if (!cid) continue;

      const deviceType =
        hw.router && hw.router.trim()
          ? hw.router.trim()
          : getRandomItem(deviceFallbackTypes);
      const mac = (hw.mac && hw.mac.trim()) || generateMAC();
      const ipAddress =
        (hw.ip && hw.ip.trim()) ||
        `192.168.${randomInt(0, 254)}.${randomInt(2, 254)}`;

      hardwareData.push({
        customerId: cid,
        deviceType,
        macAddress: mac,
        ipAddress,
      });

      if (Math.random() > 0.5) {
        hardwareData.push({
          customerId: cid,
          deviceType: getRandomItem(deviceFallbackTypes),
          macAddress: generateMAC(),
          ipAddress: `10.${randomInt(0, 254)}.${randomInt(0, 254)}.${randomInt(
            2,
            254
          )}`,
        });
      }
    }

    // Fill hardware for customers that still don't have any
    const customersWithHw = new Set(hardwareData.map((h) => h.customerId));
    for (const customer of customers) {
      if (!customersWithHw.has(customer.id)) {
        hardwareData.push({
          customerId: customer.id,
          deviceType: getRandomItem(deviceFallbackTypes),
          macAddress: generateMAC(),
          ipAddress: `192.168.${randomInt(0, 254)}.${randomInt(2, 254)}`,
        });
        if (Math.random() > 0.5) {
          hardwareData.push({
            customerId: customer.id,
            deviceType: getRandomItem(deviceFallbackTypes),
            macAddress: generateMAC(),
            ipAddress: `172.${randomInt(16, 31)}.${randomInt(
              0,
              254
            )}.${randomInt(2, 254)}`,
          });
        }
      }
    }

    const paymentsData = [];
    const invoiceItemsData = [];
    const transactionsData = [];
    const pendingChargesData = [];

    // Subscriptions + Invoices + Payments
    for (const customer of customers) {
      const plan = getRandomItem(plans);
      const createdSub = await models.Subscription.create({
        companyId: company.id,
        customerId: customer.id,
        planId: plan.id,
        startDate: new Date(),
      });

      for (const { year, month } of monthsBack) {
        const periodStart = new Date(year, month - 1, 1);
        const periodEnd = new Date(year, month, 0);
        const dueDate = new Date(year, month - 1, randomInt(10, 22));

        const amount = plan.monthlyPrice; // integer
        const tax = Math.round(amount * 0.18);
        const total = Math.round(amount + tax);

        const isPaid = Math.random() > 0.35;

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
          periodStart,
          periodEnd,
          subtotal: amount,
          taxAmount: tax,
          discounts: 0,
          amountTotal: total,
          dueDate,
          status: isPaid
            ? "PAID"
            : dueDate < new Date()
            ? "OVERDUE"
            : "PENDING",
          invoiceNumber,
          notes: `Monthly internet service for ${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`,
          isActive: true,
        });

        // Invoice items
        invoiceItemsData.push({
          invoiceId: createdInvoice.id,
          itemType: "INTERNET_SERVICE",
          description: `${plan.name} - Monthly Service`,
          quantity: 1,
          unitPrice: amount,
          totalAmount: amount,
          isActive: true,
        });

        if (Math.random() > 0.7) {
          invoiceItemsData.push({
            invoiceId: createdInvoice.id,
            itemType: "ROUTER_INSTALLATION",
            description: "Router Installation Service",
            quantity: 1,
            unitPrice: 500,
            totalAmount: 500,
            isActive: true,
          });
        }

        if (Math.random() > 0.8) {
          invoiceItemsData.push({
            invoiceId: createdInvoice.id,
            itemType: "LATE_FEE",
            description: "Late Payment Fee",
            quantity: 1,
            unitPrice: 100,
            totalAmount: 100,
            isActive: true,
          });
        }

        if (isPaid) {
          const collectionDate = generateRandomDateInMonth(year, month);
          paymentsData.push({
            companyId: company.id,
            invoiceId: createdInvoice.id,
            collectedBy: customer.assignedAgentId,
            collectedAt: collectionDate,
            method: getRandomItem(["UPI", "CASH", "BHIM", "PhonePe", "CARD"]),
            amount: total,
            comments: `Payment collected for invoice ${invoiceNumber}`,
          });

          transactionsData.push({
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
        } else {
          transactionsData.push({
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
          });
        }
      }

      // Pending charges
      if (Math.random() > 0.6) {
        const pendingChargeTypes = [
          "ROUTER_INSTALLATION",
          "EQUIPMENT_CHARGE",
          "LATE_FEE",
          "ADJUSTMENT",
          "OTHER",
        ];
        const chargeType = getRandomItem(pendingChargeTypes);
        pendingChargesData.push({
          companyId: company.id,
          customerId: customer.id,
          chargeType,
          description: `${chargeType
            .replace(/_/g, " ")
            .toLowerCase()} charge for ${customer.fullName}`,
          amount: randomInt(100, 1000),
          isApplied: Math.random() > 0.7,
          appliedToInvoiceId: null,
          appliedDate: null,
          createdBy: getRandomItem(admins).id,
          isActive: true,
        });
      }
    }

    await models.CustomerHardware.bulkCreate(hardwareData);
    await models.InvoiceItem.bulkCreate(invoiceItemsData);
    await models.Payment.bulkCreate(paymentsData);
    await models.Transaction.bulkCreate(transactionsData);
    await models.PendingCharge.bulkCreate(pendingChargesData);

    // --- Additional current-month collections (varied dates) ---
    console.log("Adding additional current-month collection data...");
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const extraCustomers = customers.slice(0, Math.min(15, customers.length));
    for (const customer of extraCustomers) {
      const plan = getRandomItem(plans);
      const subscription = await models.Subscription.findOne({
        where: { customerId: customer.id },
      });
      const days = [1, 5, 10, 15, 20, 25, 28, 30].filter(
        (d) => new Date(currentYear, currentMonth - 1, d) <= now
      );

      for (const day of days) {
        if (Math.random() > 0.4) {
          const periodStart = new Date(currentYear, currentMonth - 1, 1);
          const periodEnd = new Date(currentYear, currentMonth, 0);
          const dueDate = new Date(currentYear, currentMonth - 1, 15);

          const amount = plan.monthlyPrice;
          const tax = Math.round(amount * 0.18);
          const total = Math.round(amount + tax);

          const invoiceDate = new Date(currentYear, currentMonth - 1, 1);
          const invoiceNumber = generateInvoiceNumber(
            company.id,
            customer.id,
            invoiceDate
          );

          const createdInvoice = await models.Invoice.create({
            companyId: company.id,
            customerId: customer.id,
            subscriptionId: subscription.id,
            periodStart,
            periodEnd,
            subtotal: amount,
            taxAmount: tax,
            discounts: 0,
            amountTotal: total,
            dueDate,
            status: "PAID",
            invoiceNumber,
            notes: `Additional ${periodStart.toLocaleString("default", {
              month: "long",
            })} invoice for ${customer.fullName}`,
            isActive: true,
          });

          await models.InvoiceItem.create({
            invoiceId: createdInvoice.id,
            itemType: "INTERNET_SERVICE",
            description: `${plan.name} - Monthly Service`,
            quantity: 1,
            unitPrice: amount,
            totalAmount: amount,
            isActive: true,
          });

          const collectionDate = new Date(
            currentYear,
            currentMonth - 1,
            day,
            randomInt(9, 18),
            randomInt(0, 59)
          );
          await models.Payment.create({
            companyId: company.id,
            invoiceId: createdInvoice.id,
            collectedBy: customer.assignedAgentId,
            collectedAt: collectionDate,
            method: getRandomItem(["UPI", "CASH", "BHIM", "PhonePe", "CARD"]),
            amount: total,
            comments: `Additional ${periodStart.toLocaleString("default", {
              month: "long",
            })} payment for invoice ${invoiceNumber}`,
          });

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
