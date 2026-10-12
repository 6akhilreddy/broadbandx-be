const { Op } = require("sequelize");
const Customer = require("../models/Customer");
const CustomerHardware = require("../models/CustomerHardware");
const Inventory = require("../models/Inventory");
const InventoryLog = require("../models/InventoryLog");
const Subscription = require("../models/Subscription");
const Plan = require("../models/Plan");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const Area = require("../models/Area");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const CustomerDocument = require("../models/CustomerDocument");
const sequelize = require("../config/db");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { resolveBroadbandxStorageRoot } = require("../utils/storagePaths");
const {
  getCurrentBalance,
  generateInvoiceNumber,
  generatePaymentNumber,
} = require("../utils/financeUtils");
const {
  calculateNextRenewalDate,
} = require("../utils/billingUtils");
const {
  getManagedAgentIds,
  buildCustomerWhere,
  isSupervisor,
} = require("../utils/supervisorUtils");
const {
  normalizePlanLines,
  createPlanSubscriptions,
  createOpeningBalanceTransaction,
  generateInitialInvoice,
  renewCustomerBilling,
  getNextBillingNumber,
} = require("../services/customerBillingService");

// Cross-platform, system-wide writable storage root (env override supported)
const BROADBANDX_STORAGE_ROOT = resolveBroadbandxStorageRoot();

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function sanitizeFilename(name = "") {
  return String(name)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 180);
}

const customerDocumentsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const customerId = req.params.id || req.params.customerId;
      const dir = path.join(
        BROADBANDX_STORAGE_ROOT,
        "customers",
        String(customerId)
      );
      ensureDir(dir);
      cb(null, dir);
    } catch (e) {
      cb(e);
    }
  },
  filename: (req, file, cb) => {
    const ts = Date.now();
    const original = sanitizeFilename(file.originalname || "file");
    cb(null, `${ts}-${original}`);
  },
});

const uploadCustomerDocuments = multer({
  storage: customerDocumentsStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

exports.uploadDocumentsMiddleware = uploadCustomerDocuments.array("files", 10);

exports.listCustomerDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const customer = await Customer.findOne({ where: { id, companyId } });
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const docs = await CustomerDocument.findAll({
      where: { customerId: id, companyId, isActive: true },
      order: [["createdAt", "DESC"]],
    });

    const data = docs.map((d) => ({
      id: d.id,
      displayName: d.displayName,
      originalName: d.originalName,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      uploadedBy: d.uploadedBy,
      createdAt: d.createdAt,
      url: `/broadbandx/${d.relativePath}`,
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error("List customer documents error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.uploadCustomerDocuments = async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const customer = await Customer.findOne({
      where: { id, companyId },
      transaction: dbTransaction,
    });
    if (!customer) {
      await dbTransaction.rollback();
      return res.status(404).json({ error: "Customer not found" });
    }

    const files = req.files || [];
    if (!files.length) {
      await dbTransaction.rollback();
      return res.status(400).json({ error: "No files uploaded" });
    }

    const fileNames = req.body.fileNames || req.body.fileName || [];
    const fileNamesArr = Array.isArray(fileNames) ? fileNames : [fileNames];

    const created = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const storedName = f.filename;
      const relativePath = path
        .join("customers", String(id), storedName)
        .replaceAll("\\\\", "/");

      const displayName =
        (fileNamesArr[i] && String(fileNamesArr[i]).trim()) || null;

      const row = await CustomerDocument.create(
        {
          companyId,
          customerId: parseInt(id, 10),
          displayName,
          originalName: f.originalname,
          storedName,
          mimeType: f.mimetype,
          sizeBytes: f.size,
          relativePath,
          uploadedBy: req.user.id,
        },
        { transaction: dbTransaction }
      );

      created.push(row);
    }

    await dbTransaction.commit();
    res.status(201).json({
      success: true,
      data: created.map((d) => ({
        id: d.id,
        displayName: d.displayName,
        originalName: d.originalName,
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes,
        createdAt: d.createdAt,
        url: `/broadbandx/${d.relativePath}`,
      })),
    });
  } catch (err) {
    await dbTransaction.rollback();
    console.error("Upload customer documents error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCustomerDocument = async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  try {
    const { id, docId } = req.params;
    const { companyId } = req.user;

    const customer = await Customer.findOne({
      where: { id, companyId },
      transaction: dbTransaction,
    });
    if (!customer) {
      await dbTransaction.rollback();
      return res.status(404).json({ error: "Customer not found" });
    }

    const doc = await CustomerDocument.findOne({
      where: { id: docId, customerId: id, companyId, isActive: true },
      transaction: dbTransaction,
    });

    if (!doc) {
      await dbTransaction.rollback();
      return res.status(404).json({ error: "Document not found" });
    }

    await doc.update({ isActive: false }, { transaction: dbTransaction });

    // Best-effort remove file from disk (do not fail request)
    try {
      const absPath = path.join(BROADBANDX_STORAGE_ROOT, doc.relativePath);
      if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
    } catch (e) {
      console.warn("Failed to delete document file:", e.message);
    }

    await dbTransaction.commit();
    res.json({ success: true });
  } catch (err) {
    await dbTransaction.rollback();
    console.error("Delete customer document error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Preview next billing number for the company (used on Add Customer form)
exports.previewNextBillingNumber = async (req, res) => {
  try {
    const companyId =
      req.userRoleCode !== "SUPER_ADMIN" && req.userCompanyId
        ? req.userCompanyId
        : parseInt(req.query.companyId, 10);

    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    const billingNumber = await getNextBillingNumber(Customer, companyId);
    res.json({ billingNumber });
  } catch (err) {
    console.error("Preview billing number error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Create Customer with Hardware, billing profile, plan lines, and initial invoice
exports.createCustomer = async (req, res) => {
  const dbTransaction = await sequelize.transaction();

  try {
    const { customer, hardware } = req.body;
    const companyId =
      req.userRoleCode !== "SUPER_ADMIN" && req.userCompanyId
        ? req.userCompanyId
        : customer.companyId;

    if (req.userRoleCode !== "SUPER_ADMIN" && req.userCompanyId) {
      customer.companyId = req.userCompanyId;
    }

    if (customer.email === "") customer.email = null;
    if (customer.customerCode === "") customer.customerCode = null;
    if (!customer.phone || customer.phone === "") customer.phone = null;
    if (!customer.phoneSecondary || customer.phoneSecondary === "") {
      customer.phoneSecondary = null;
    }

    const planLines = normalizePlanLines(req.body);
    const hasFixedBill = parseFloat(customer.fixedBillAmount) > 0;
    if (!planLines.length && !hasFixedBill) {
      await dbTransaction.rollback();
      return res.status(400).json({
        error: "At least one plan or a fixed bill amount is required",
      });
    }

    customer.billingNumber = await getNextBillingNumber(Customer, companyId);

    if (!customer.billingStartDate) {
      customer.billingStartDate =
        customer.installationDate || new Date().toISOString().split("T")[0];
    }

    if (!customer.assignedAgentId && req.user?.id) {
      customer.assignedAgentId = req.user.id;
    }

    customer.companyId = companyId;
    if (req.user?.id) {
      customer.createdBy = req.user.id;
    }

    const newCustomer = await Customer.create(customer, {
      transaction: dbTransaction,
    });

    // Support multiple hardware devices (hardwareList) or single hardware object
    const itemsToProcess = [];
    if (
      Array.isArray(req.body.hardwareList) &&
      req.body.hardwareList.length > 0
    ) {
      itemsToProcess.push(...req.body.hardwareList);
    } else if (
      hardware &&
      (hardware.macAddress ||
        hardware.deviceType ||
        hardware.ipAddress ||
        hardware.inventoryId)
    ) {
      itemsToProcess.push(hardware);
    }

    for (const hwItem of itemsToProcess) {
      const cleanMac = hwItem.macAddress ? hwItem.macAddress.trim() : null;
      let linkedInventoryId = hwItem.inventoryId || null;

      if (linkedInventoryId) {
        // Selected from available stock
        const inv = await Inventory.findByPk(linkedInventoryId, {
          transaction: dbTransaction,
        });
        if (inv) {
          await inv.update(
            { status: "WITH_CUSTOMER", customerId: newCustomer.id },
            { transaction: dbTransaction }
          );
          await InventoryLog.create(
            {
              companyId,
              inventoryId: inv.id,
              customerId: newCustomer.id,
              action: "ASSIGNED",
              previousStatus: "AVAILABLE",
              newStatus: "WITH_CUSTOMER",
              performedBy: req.user?.id || null,
              notes: "Assigned during customer onboarding",
            },
            { transaction: dbTransaction }
          );
        }
      } else if (cleanMac) {
        // Added manually - auto-create in Inventory
        const existingInv = await Inventory.findOne({
          where: { macAddress: cleanMac, companyId },
          transaction: dbTransaction,
        });

        if (existingInv) {
          linkedInventoryId = existingInv.id;
          await existingInv.update(
            { status: "WITH_CUSTOMER", customerId: newCustomer.id },
            { transaction: dbTransaction }
          );
          await InventoryLog.create(
            {
              companyId,
              inventoryId: existingInv.id,
              customerId: newCustomer.id,
              action: "ASSIGNED",
              previousStatus: existingInv.status,
              newStatus: "WITH_CUSTOMER",
              performedBy: req.user?.id || null,
              notes: "Assigned existing hardware during customer onboarding",
            },
            { transaction: dbTransaction }
          );
        } else {
          const newInv = await Inventory.create(
            {
              companyId,
              category: hwItem.deviceType || hwItem.category || "Router",
              deviceName: hwItem.deviceName || hwItem.deviceType || "Router",
              macAddress: cleanMac,
              ipAddress: hwItem.ipAddress || null,
              membershipNumber: hwItem.membershipNumber || null,
              status: "WITH_CUSTOMER",
              customerId: newCustomer.id,
              isActive: true,
            },
            { transaction: dbTransaction }
          );
          linkedInventoryId = newInv.id;
          await InventoryLog.create(
            {
              companyId,
              inventoryId: newInv.id,
              customerId: newCustomer.id,
              action: "CREATED",
              newStatus: "WITH_CUSTOMER",
              performedBy: req.user?.id || null,
              notes: "Added & assigned during customer onboarding",
            },
            { transaction: dbTransaction }
          );
        }
      }

      await CustomerHardware.create(
        {
          customerId: newCustomer.id,
          inventoryId: linkedInventoryId,
          deviceType: hwItem.deviceType || hwItem.category || "Router",
          macAddress: cleanMac,
          ipAddress: hwItem.ipAddress || null,
          membershipNumber: hwItem.membershipNumber || null,
        },
        { transaction: dbTransaction }
      );
    }

    let subscriptions = [];
    if (planLines.length) {
      subscriptions = await createPlanSubscriptions(
        newCustomer,
        planLines,
        companyId,
        newCustomer.billingStartDate,
        dbTransaction
      );
    }

    await createOpeningBalanceTransaction(
      newCustomer,
      companyId,
      req.user.id,
      dbTransaction
    );

    if (planLines.length || hasFixedBill) {
      await generateInitialInvoice(
        newCustomer,
        subscriptions,
        req,
        dbTransaction
      );
    }

    await dbTransaction.commit();
    res.status(201).json(newCustomer);
  } catch (err) {
    await dbTransaction.rollback();
    console.error("Customer creation error:", err);
    res.status(400).json({ error: err.message, details: err.errors });
  }
};

// Get all Customers with balance information
exports.getAllCustomers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      areaId,
      paymentStatus,
      renewalStatus,
      followUpStatus,
    } = req.query;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Base where condition for customer search
    let whereCondition = {};

    // Add company filter for non-super admin users
    if (req.userRoleCode !== "SUPER_ADMIN" && req.userCompanyId) {
      whereCondition.companyId = req.userCompanyId;
    }

    if (isSupervisor(req.user)) {
      const managedAgentIds = await getManagedAgentIds(
        req.user.id,
        req.user.companyId
      );
      whereCondition = buildCustomerWhere(
        req.user,
        whereCondition,
        managedAgentIds
      );
    }

    if (search) {
      whereCondition[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { customerCode: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Area filter
    if (areaId) {
      whereCondition.areaId = areaId;
    }

    // Follow up filter
    if (followUpStatus === "today") {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      whereCondition.followUpDate = { [Op.eq]: todayStr };
    }

    // Build subscription where clause (match dashboard logic - only ACTIVE subscriptions)
    const subscriptionWhere = { status: "ACTIVE" };
    // Add company filter to subscription if customer is filtered by company
    if (whereCondition.companyId) {
      subscriptionWhere.companyId = whereCondition.companyId;
    }

    // If renewalStatus filter is specified, add it to subscription where clause
    // This ensures we filter at the database level, not in JavaScript
    if (renewalStatus) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayStr = today.toISOString().split("T")[0];
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStartStr = monthStart.toISOString().split("T")[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const monthEndStr = monthEnd.toISOString().split("T")[0];

      if (renewalStatus === "today") {
        subscriptionWhere.nextRenewalDate = { [Op.eq]: todayStr };
      } else if (renewalStatus === "thisMonth") {
        subscriptionWhere.nextRenewalDate = {
          [Op.between]: [monthStartStr, monthEndStr],
        };
      } else if (renewalStatus === "upcoming") {
        subscriptionWhere.nextRenewalDate = { [Op.gt]: monthEndStr };
      } else if (renewalStatus === "expired") {
        subscriptionWhere.nextRenewalDate = { [Op.lt]: todayStr };
      }
    }

    // Fetch customers
    const queryOptions = {
      attributes: [
        "id",
        "fullName",
        "phone",
        "address",
        "customerCode",
        "isActive",
        "createdAt",
        "companyId",
      ],
      where: whereCondition,
      include: [
        {
          model: Area,
          attributes: ["areaName"],
          required: false,
        },
        {
          model: Subscription,
          attributes: ["nextRenewalDate", "status"],
          where: subscriptionWhere,
          required: renewalStatus ? true : false,
        },
      ],
      order: [["createdAt", "DESC"]],
      distinct: true,
    };

    if (!paymentStatus) {
      queryOptions.limit = parseInt(limit);
      queryOptions.offset = offset;
    }

    const { rows: customers, count: total } = await Customer.findAndCountAll(queryOptions);

    // Get balances for all customers
    const companyId =
      req.userRoleCode !== "SUPER_ADMIN" && req.userCompanyId
        ? req.userCompanyId
        : null;

    const transformedCustomers = await Promise.all(
      customers.map(async (customer) => {
        const balance = companyId
          ? await getCurrentBalance(
              customer.id,
              customer.companyId || companyId
            )
          : await getCurrentBalance(customer.id, customer.companyId);

        return {
          id: customer.id,
          customerCode: customer.customerCode,
          fullName: customer.fullName,
          phone: customer.phone,
          address: customer.address,
          balance: balance,
          areaName: customer.Area?.areaName || null,
          nextRenewalDate: customer.Subscriptions?.[0]?.nextRenewalDate || null,
          isActive: customer.isActive,
        };
      })
    );

    let finalCustomers = transformedCustomers;
    let actualTotal = total;

    if (paymentStatus) {
      finalCustomers = transformedCustomers.filter((customer) => {
        if (paymentStatus === "paid") {
          return customer.balance === 0;
        } else if (paymentStatus === "unpaid") {
          return customer.balance > 0;
        }
        return true;
      });
      actualTotal = finalCustomers.length;

      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      finalCustomers = finalCustomers.slice(startIndex, endIndex);
    }

    // Return paginated response
    const currentPage = parseInt(page);
    const totalPages = Math.ceil(actualTotal / limit);

    res.json({
      data: finalCustomers,
      pagination: {
        totalItems: actualTotal,
        currentPage,
        totalPages,
        pageSize: parseInt(limit),
        hasNext: currentPage < totalPages,
        hasPrevious: currentPage > 1,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    // Add company filter for non-super admin users
    let whereCondition = { id: req.params.id };
    if (req.userRoleCode !== "SUPER_ADMIN" && req.userCompanyId) {
      whereCondition.companyId = req.userCompanyId;
    }

    const customer = await Customer.findOne({
      where: whereCondition,
      include: [
        {
          model: Area,
          attributes: ["id", "areaName"],
        },
        {
          model: CustomerHardware,
          attributes: [
            "id",
            "inventoryId",
            "deviceType",
            "macAddress",
            "ipAddress",
            "membershipNumber",
          ],
        },
        {
          model: Subscription,
          attributes: [
            "id",
            "planId",
            "quantity",
            "startDate",
            "agreedMonthlyPrice",
            "status",
            "nextRenewalDate",
            "lastRenewalDate",
          ],
          where: { status: "ACTIVE" }, // Only get active subscriptions
          required: false,
          include: [
            {
              model: Plan,
              attributes: ["id", "name", "monthlyPrice", "code", "benefits"],
            },
          ],
        },
      ],
    });

    if (!customer) return res.status(404).json({ error: "Customer not found" });

    // Get current balance
    const balance = await getCurrentBalance(customer.id, customer.companyId);

    // Get latest invoice
    const latestInvoice = await Invoice.findOne({
      where: {
        customerId: customer.id,
        isActive: true,
      },
      order: [["createdAt", "DESC"]],
    });

    // Transform the response
    const transformedCustomer = {
      ...customer.toJSON(),
      area: customer.Area
        ? {
            id: customer.Area.id,
            areaName: customer.Area.areaName,
          }
        : null,
      hardware: customer.CustomerHardwares?.[0] || null,
      hardwares: customer.CustomerHardwares || [],
      subscriptions: customer.Subscriptions
        ? customer.Subscriptions.map((sub) => ({
            ...sub.toJSON(),
            plan: sub.Plan
              ? {
                  id: sub.Plan.id,
                  name: sub.Plan.name,
                  monthlyPrice: sub.Plan.monthlyPrice,
                  code: sub.Plan.code,
                  benefits: sub.Plan.benefits,
                }
              : null,
          }))
        : [],
      subscription: customer.Subscriptions?.[0] // Keep for backward compatibility
        ? {
            ...customer.Subscriptions[0].toJSON(),
            plan: customer.Subscriptions[0].Plan
              ? {
                  id: customer.Subscriptions[0].Plan.id,
                  name: customer.Subscriptions[0].Plan.name,
                  monthlyPrice: customer.Subscriptions[0].Plan.monthlyPrice,
                  code: customer.Subscriptions[0].Plan.code,
                  benefits: customer.Subscriptions[0].Plan.benefits,
                }
              : null,
          }
        : null,
      balance: balance,
      latestInvoice: latestInvoice
        ? {
            id: latestInvoice.id,
            invoiceNumber: latestInvoice.invoiceNumber,
            type: latestInvoice.type,
            periodStart: latestInvoice.periodStart,
            periodEnd: latestInvoice.periodEnd,
            amountTotal: latestInvoice.amountTotal,
            dueDate: latestInvoice.dueDate,
            createdAt: latestInvoice.createdAt,
          }
        : null,
      followUpDate: customer.followUpDate,
      followUpNotes: customer.followUpNotes,
    };

    res.json(transformedCustomer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Customer with Hardware and Subscription
exports.updateCustomer = async (req, res) => {
  const dbTransaction = await sequelize.transaction();

  try {
    const { customer, hardware } = req.body;

    const existingCustomer = await Customer.findOne({
      where: { id: req.params.id },
      transaction: dbTransaction,
    });
    if (!existingCustomer) {
      await dbTransaction.rollback();
      return res.status(404).json({ error: "Customer not found" });
    }

    // Update Customer only if customer data is provided
    if (customer) {
      // Add companyId for non-super admin users
      if (req.userRoleCode !== "SUPER_ADMIN" && req.userCompanyId) {
        customer.companyId = req.userCompanyId;
      }

      // Handle unique fields - convert empty strings to null
      if (customer.email === "") {
        customer.email = null;
      }
      if (customer.customerCode === "") {
        customer.customerCode = null;
      }

      // Update Customer
      await Customer.update(customer, {
        where: { id: req.params.id },
        transaction: dbTransaction,
      });
    }

    // Update CustomerHardware
    if (hardware) {
      // Handle unique fields - convert empty strings to null
      if (hardware.macAddress === "") {
        hardware.macAddress = null;
      }

      await CustomerHardware.update(hardware, {
        where: { customerId: req.params.id },
        transaction: dbTransaction,
      });
    }

    const planLines = normalizePlanLines(req.body);
    if (planLines.length) {
      const companyId =
        req.userRoleCode !== "SUPER_ADMIN" && req.userCompanyId
          ? req.userCompanyId
          : existingCustomer.companyId;

      await Subscription.update(
        { status: "CANCELLED" },
        {
          where: { customerId: req.params.id, status: "ACTIVE" },
          transaction: dbTransaction,
        }
      );

      await createPlanSubscriptions(
        existingCustomer,
        planLines,
        companyId,
        existingCustomer.billingStartDate ||
          new Date().toISOString().split("T")[0],
        dbTransaction
      );
    } else if (req.body.subscription) {
      const sub = req.body.subscription;
      if (sub.id) {
        await Subscription.update(sub, {
          where: { id: sub.id, customerId: req.params.id },
          transaction: dbTransaction,
        });
      }
    }

    // Commit the transaction
    await dbTransaction.commit();

    // Fetch updated customer with all related data
    const updatedCustomer = await Customer.findByPk(req.params.id, {
      include: [
        {
          model: Area,
          attributes: ["id", "areaName"],
        },
        {
          model: CustomerHardware,
          attributes: [
            "id",
            "inventoryId",
            "deviceType",
            "macAddress",
            "ipAddress",
            "membershipNumber",
          ],
        },
        {
          model: Subscription,
          attributes: [
            "id",
            "planId",
            "quantity",
            "startDate",
            "agreedMonthlyPrice",
            "status",
            "nextRenewalDate",
            "lastRenewalDate",
          ],
          include: [
            {
              model: Plan,
              attributes: ["name", "monthlyPrice", "code", "benefits"],
            },
          ],
        },
      ],
    });

    res.json(updatedCustomer);
  } catch (err) {
    await dbTransaction.rollback();
    console.error("Customer update error:", err);
    res.status(400).json({ error: err.message, details: err.errors });
  }
};

// Delete Customer
exports.deleteCustomer = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.userRoleCode !== "SUPER_ADMIN" && req.userCompanyId) {
      where.companyId = req.userCompanyId;
    }
    const deleted = await Customer.destroy({ where });
    if (!deleted) return res.status(404).json({ error: "Customer not found" });
    res.json({ message: "Customer deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add on bill (add item charge)
exports.addOnBill = async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  try {
    const { customerId } = req.params;
    const { companyId, id: createdBy } = req.user;
    const { itemName, price, description } = req.body;

    if (!itemName || !price) {
      return res.status(400).json({
        success: false,
        message: "Item name and price are required",
      });
    }

    // Verify customer exists and belongs to company
    const customer = await Customer.findOne({
      where: {
        id: customerId,
        companyId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Get current balance
    const currentBalance = await getCurrentBalance(customerId, companyId);
    const priceValue = parseFloat(price);
    const newBalance = currentBalance + priceValue;

    // Create transaction
    const transaction = await Transaction.create(
      {
        companyId,
        customerId,
        type: "ADD_ON_BILL",
        direction: "DEBIT",
        amount: priceValue,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: description || `Add on bill: ${itemName}`,
        referenceType: "invoice",
        transactionDate: new Date(),
        createdBy,
      },
      { transaction: dbTransaction }
    );

    // Create ADJUSTED invoice document for printing
    const invoice = await Invoice.create(
      {
        transactionId: transaction.id,
        invoiceNumber: generateInvoiceNumber(),
        type: "ADJUSTED",
        companyId,
        customerId,
        subscriptionId: null,
        periodStart: null,
        periodEnd: null,
        subtotal: priceValue,
        taxAmount: 0,
        discounts: 0,
        amountTotal: priceValue,
        prevBalance: null,
        items: [
          {
            name: itemName,
            quantity: 1,
            unitPrice: priceValue,
            totalAmount: priceValue,
            itemType: "OTHER",
          },
        ],
        dueDate: new Date().toISOString().split("T")[0],
      },
      { transaction: dbTransaction }
    );

    // Update transaction reference
    await transaction.update(
      { referenceId: invoice.id },
      { transaction: dbTransaction }
    );

    await dbTransaction.commit();

    res.status(201).json({
      success: true,
      data: {
        transaction: transaction.toJSON(),
        invoice: invoice.toJSON(),
      },
      message: "Add on bill created successfully",
    });
  } catch (error) {
    await dbTransaction.rollback();
    console.error("Error adding on bill:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add on bill",
      error: error.message,
    });
  }
};

// Adjust customer balance
exports.adjustBalance = async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  try {
    const { customerId } = req.params;
    const { companyId, id: createdBy } = req.user;
    const { newBalance, reason } = req.body;

    if (newBalance === undefined && newBalance !== 0) {
      return res.status(400).json({
        success: false,
        message: "New balance is required",
      });
    }

    // Verify customer exists and belongs to company
    const customer = await Customer.findOne({
      where: {
        id: customerId,
        companyId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Get current balance
    const currentBalance = await getCurrentBalance(customerId, companyId);
    const newBalanceValue = parseFloat(newBalance);
    const adjustmentAmount = newBalanceValue - currentBalance;

    if (adjustmentAmount === 0) {
      return res.status(400).json({
        success: false,
        message: "New balance is same as current balance",
      });
    }

    // Create transaction
    const transaction = await Transaction.create(
      {
        companyId,
        customerId,
        type: "BALANCE_ADJUSTMENT",
        direction: adjustmentAmount > 0 ? "DEBIT" : "CREDIT",
        amount: Math.abs(adjustmentAmount),
        balanceBefore: currentBalance,
        balanceAfter: newBalanceValue,
        description: `Balance adjusted from ₹${currentBalance.toFixed(
          2
        )} to ₹${newBalanceValue.toFixed(2)}${reason ? ` - ${reason}` : ""}`,
        referenceType: "invoice",
        transactionDate: new Date(),
        createdBy,
      },
      { transaction: dbTransaction }
    );

    // Create ADJUSTED invoice document for printing
    const invoice = await Invoice.create(
      {
        transactionId: transaction.id,
        invoiceNumber: generateInvoiceNumber(),
        type: "ADJUSTED",
        companyId,
        customerId,
        subscriptionId: null,
        periodStart: null,
        periodEnd: null,
        subtotal: 0,
        taxAmount: 0,
        discounts: 0,
        amountTotal: Math.abs(adjustmentAmount),
        prevBalance: currentBalance,
        items: [
          {
            name: "Balance Adjustment",
            quantity: 1,
            unitPrice: adjustmentAmount,
            totalAmount: adjustmentAmount,
            itemType: "ADJUSTMENT",
          },
        ],
        dueDate: new Date().toISOString().split("T")[0],
      },
      { transaction: dbTransaction }
    );

    // Update transaction reference
    await transaction.update(
      { referenceId: invoice.id },
      { transaction: dbTransaction }
    );

    await dbTransaction.commit();

    res.status(201).json({
      success: true,
      data: {
        transaction: transaction.toJSON(),
        invoice: invoice.toJSON(),
      },
      message: "Balance adjusted successfully",
    });
  } catch (error) {
    await dbTransaction.rollback();
    console.error("Error adjusting balance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to adjust balance",
      error: error.message,
    });
  }
};

// Get customer balance history
exports.getCustomerBalanceHistory = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { companyId } = req.user;

    // Verify customer exists and belongs to company
    const customer = await Customer.findOne({
      where: {
        id: customerId,
        companyId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Get all transactions for the customer
    const transactions = await Transaction.findAll({
      where: {
        customerId,
        companyId,
        isActive: true,
      },
      include: [
        {
          model: Customer,
          as: "Customer",
          attributes: ["id", "fullName", "customerCode"],
        },
        {
          model: User,
          as: "CreatedBy",
          attributes: ["id", "name"],
        },
        {
          model: Invoice,
          attributes: [
            "id",
            "invoiceNumber",
            "type",
            "periodStart",
            "periodEnd",
            "amountTotal",
          ],
          required: false,
        },
        {
          model: Payment,
          attributes: ["id", "paymentNumber", "method", "amount"],
          required: false,
        },
      ],
      order: [
        ["transactionDate", "DESC"],
        ["id", "DESC"],
      ],
    });

    // Get current balance
    const currentBalance = await getCurrentBalance(customerId, companyId);

    res.json({
      success: true,
      data: {
        transactions: transactions.map((t) => ({
          id: t.id,
          type: t.type,
          direction: t.direction,
          amount: t.amount,
          balanceBefore: t.balanceBefore,
          balanceAfter: t.balanceAfter,
          description: t.description,
          transactionDate: t.transactionDate,
          recordedDate: t.recordedDate,
          createdBy: t.CreatedBy
            ? {
                id: t.CreatedBy.id,
                name: t.CreatedBy.name,
              }
            : null,
          invoice: t.Invoice
            ? {
                id: t.Invoice.id,
                invoiceNumber: t.Invoice.invoiceNumber,
                type: t.Invoice.type,
                periodStart: t.Invoice.periodStart,
                periodEnd: t.Invoice.periodEnd,
                amountTotal: t.Invoice.amountTotal,
              }
            : null,
          payment: t.Payment
            ? {
                id: t.Payment.id,
                paymentNumber: t.Payment.paymentNumber,
                method: t.Payment.method,
                amount: t.Payment.amount,
              }
            : null,
        })),
        currentBalance: currentBalance,
      },
    });
  } catch (error) {
    console.error("Error fetching customer balance history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer balance history",
      error: error.message,
    });
  }
};

// Delete transaction (soft delete - only latest transaction can be deleted)
exports.deleteTransaction = async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  try {
    const { transactionId } = req.params;
    const where = {
      id: transactionId,
      isActive: true,
    };
    if (req.userRoleCode !== "SUPER_ADMIN" && req.userCompanyId) {
      where.companyId = req.userCompanyId;
    }

    const transaction = await Transaction.findOne({
      where,
      transaction: dbTransaction,
    });

    if (!transaction) {
      await dbTransaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Verify this is the latest transaction (most recent by date and id)
    const latestTransaction = await Transaction.findOne({
      where: {
        customerId: transaction.customerId,
        companyId: transaction.companyId,
        isActive: true,
      },
      attributes: ["id"],
      order: [
        ["transactionDate", "DESC"],
        ["id", "DESC"],
      ],
      transaction: dbTransaction,
    });

    const requestedId = parseInt(transactionId, 10);
    const latestId = latestTransaction
      ? parseInt(latestTransaction.id, 10)
      : null;

    if (!latestTransaction || latestId !== requestedId) {
      await dbTransaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Only the latest transaction can be deleted",
      });
    }

    // Soft delete transaction
    await transaction.update(
      { isActive: false },
      { transaction: dbTransaction }
    );

    // Also soft-delete associated payment or invoice if linked
    if (transaction.referenceType === "payment" && transaction.referenceId) {
      await Payment.update(
        { isActive: false },
        { where: { id: transaction.referenceId }, transaction: dbTransaction }
      );
    } else if (transaction.type === "PAYMENT") {
      await Payment.update(
        { isActive: false },
        { where: { transactionId: transaction.id }, transaction: dbTransaction }
      );
    }

    if (transaction.referenceType === "invoice" && transaction.referenceId) {
      await Invoice.update(
        { isActive: false },
        { where: { id: transaction.referenceId }, transaction: dbTransaction }
      );
    } else if (transaction.type === "INVOICE") {
      await Invoice.update(
        { isActive: false },
        { where: { transactionId: transaction.id }, transaction: dbTransaction }
      );
    }

    await dbTransaction.commit();

    res.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    await dbTransaction.rollback();
    console.error("Error deleting transaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete transaction",
      error: error.message,
    });
  }
};

// Renew subscription - generate new invoice for all active plan lines
exports.renewSubscription = async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  try {
    const { customerId } = req.params;
    const { companyId, id: createdBy } = req.user;

    const customer = await Customer.findOne({
      where: { id: customerId, companyId },
      include: [
        {
          model: Subscription,
          where: { status: "ACTIVE" },
          required: false,
          include: [{ model: Plan }],
        },
      ],
    });

    if (!customer || !customer.Subscriptions?.length) {
      return res.status(404).json({
        success: false,
        message: "Customer or active subscriptions not found",
      });
    }

    const { invoice, invoiceTransaction, subscriptions } =
      await renewCustomerBilling(
        customer,
        customer.Subscriptions,
        companyId,
        createdBy,
        dbTransaction
      );

    await dbTransaction.commit();

    res.status(201).json({
      success: true,
      data: {
        transaction: invoiceTransaction.toJSON(),
        invoice: invoice.toJSON(),
        subscriptions: subscriptions.map((s) => s.toJSON()),
      },
      message: "Subscription renewed successfully",
    });
  } catch (error) {
    await dbTransaction.rollback();
    console.error("Error renewing subscription:", error);
    res.status(500).json({
      success: false,
      message: "Failed to renew subscription",
      error: error.message,
    });
  }
};

// Generate bill - create invoice and transaction from selected plans/items
exports.generateBill = async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  try {
    const { customerId } = req.params;
    const { companyId, id: createdBy } = req.user;
    const {
      periodStart,
      periodEnd,
      items = [],
      subtotal = 0,
      additionalAmount = 0,
      prevBalance = 0,
      amountTotal = 0,
      collectPayment = false,
      subscriptions = [], // Array of subscriptions to create/update
    } = req.body;

    // Verify customer exists
    const customer = await Customer.findOne({
      where: {
        id: customerId,
        companyId,
      },
    });

    if (!customer) {
      await dbTransaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Get current balance
    const currentBalance = await getCurrentBalance(customerId, companyId);
    const periodCharges =
      Math.round(
        (parseFloat(subtotal || 0) + parseFloat(additionalAmount || 0)) * 100
      ) / 100;
    const newBalance =
      Math.round((currentBalance + periodCharges) * 100) / 100;

    // Create transaction for invoice (ledger debits the current period charges, not previous balance again)
    const invoiceTransaction = await Transaction.create(
      {
        companyId,
        customerId,
        type: "INVOICE",
        direction: "DEBIT",
        amount: periodCharges,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: `Bill invoice ${periodStart} to ${periodEnd}`,
        referenceType: "invoice",
        transactionDate: new Date(),
        createdBy,
      },
      { transaction: dbTransaction }
    );

    // Prepare invoice items
    const invoiceItems = items.map((item) => ({
      name: item.name || "Item",
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0,
      totalAmount: item.totalAmount || item.unitPrice * (item.quantity || 1),
      itemType: item.itemType || "OTHER",
    }));

    // Add previous balance as an item if present
    if (prevBalance > 0) {
      invoiceItems.push({
        name: "Previous Balance",
        quantity: 1,
        unitPrice: prevBalance,
        totalAmount: prevBalance,
        itemType: "PREV_BALANCE",
      });
    }

    // Add additional amount as an item if present
    if (additionalAmount > 0) {
      invoiceItems.push({
        name: "Additional Charges",
        quantity: 1,
        unitPrice: additionalAmount,
        totalAmount: additionalAmount,
        itemType: "ADDITIONAL",
      });
    }

    const calculatedAmountTotal =
      Math.round((periodCharges + (prevBalance > 0 ? parseFloat(prevBalance) : 0)) * 100) / 100;

    // Create invoice document
    const invoice = await Invoice.create(
      {
        transactionId: invoiceTransaction.id,
        invoiceNumber: generateInvoiceNumber(),
        type: "SUBSCRIPTION",
        companyId,
        customerId,
        subscriptionId: null, // Will be updated if subscription exists
        periodStart: periodStart,
        periodEnd: periodEnd,
        subtotal: periodCharges,
        taxAmount: 0,
        discounts: 0,
        amountTotal: calculatedAmountTotal,
        prevBalance: prevBalance,
        items: invoiceItems,
        dueDate: periodEnd,
      },
      { transaction: dbTransaction }
    );

    // Update transaction reference
    await invoiceTransaction.update(
      { referenceId: invoice.id },
      { transaction: dbTransaction }
    );

    const nextRenewal = calculateNextRenewalDate(periodEnd);

    // Create or update subscriptions for the customer
    const createdSubscriptions = [];
    if (subscriptions && subscriptions.length > 0) {
      for (const subData of subscriptions) {
        const { planId, monthlyPrice, quantity } = subData;

        // Check if plan exists
        const plan = await Plan.findOne({
          where: { id: planId, companyId },
        });

        if (plan) {
          // Check if subscription already exists for this plan
          let subscription = await Subscription.findOne({
            where: {
              customerId,
              planId,
              status: "ACTIVE",
            },
            transaction: dbTransaction,
          });

          if (subscription) {
            // Update existing subscription
            await subscription.update(
              {
                agreedMonthlyPrice: monthlyPrice || plan.monthlyPrice,
                quantity: quantity || subscription.quantity || 1,
                lastRenewalDate: periodStart,
                nextRenewalDate: nextRenewal,
              },
              { transaction: dbTransaction }
            );
            createdSubscriptions.push(subscription);
          } else {
            // Create new subscription
            subscription = await Subscription.create(
              {
                companyId,
                customerId,
                planId,
                quantity: subData.quantity || 1,
                startDate: periodStart,
                lastRenewalDate: periodStart,
                nextRenewalDate: nextRenewal,
                agreedMonthlyPrice: monthlyPrice || plan.monthlyPrice,
                status: "ACTIVE",
              },
              { transaction: dbTransaction }
            );
            createdSubscriptions.push(subscription);
          }
        }
      }

      // Update invoice with subscription IDs if we have subscriptions
      if (createdSubscriptions.length > 0) {
        // For multiple subscriptions, we'll link to the first one or leave null
        // The invoice can reference one subscription, but items can represent multiple
        await invoice.update(
          { subscriptionId: createdSubscriptions[0].id },
          { transaction: dbTransaction }
        );
      }
    }

    // If collectPayment is true, create a payment transaction
    let payment = null;
    if (collectPayment && amountTotal > 0) {
      const paymentBalance = newBalance - amountTotal;
      const paymentTransaction = await Transaction.create(
        {
          companyId,
          customerId,
          type: "PAYMENT",
          direction: "CREDIT",
          amount: amountTotal,
          balanceBefore: newBalance,
          balanceAfter: paymentBalance,
          description: `Payment for invoice ${invoice.invoiceNumber}`,
          referenceType: "payment",
          transactionDate: new Date(),
          createdBy,
        },
        { transaction: dbTransaction }
      );

      payment = await Payment.create(
        {
          transactionId: paymentTransaction.id,
          invoiceId: invoice.id,
          paymentNumber: generatePaymentNumber(),
          companyId,
          customerId,
          amount: amountTotal,
          discount: 0,
          method: "CASH",
          collectedAt: new Date(),
          collectedBy: createdBy,
        },
        { transaction: dbTransaction }
      );

      await paymentTransaction.update(
        { referenceId: payment.id },
        { transaction: dbTransaction }
      );
    }

    await dbTransaction.commit();

    res.status(201).json({
      success: true,
      data: {
        transaction: invoiceTransaction.toJSON(),
        invoice: invoice.toJSON(),
        payment: payment ? payment.toJSON() : null,
      },
      message: collectPayment
        ? "Bill generated and payment collected successfully"
        : "Bill generated successfully",
    });
  } catch (error) {
    await dbTransaction.rollback();
    console.error("Error generating bill:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate bill",
      error: error.message,
    });
  }
};

// Get invoice details for preview
exports.getInvoiceDetails = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { companyId } = req.user;

    const invoice = await Invoice.findOne({
      where: {
        id: invoiceId,
        companyId,
        isActive: true,
      },
      include: [
        {
          model: Customer,
          attributes: ["id", "fullName", "customerCode", "phone", "address"],
          include: [
            {
              model: Area,
              attributes: ["areaName"],
            },
          ],
        },
        {
          model: Transaction,
          required: false,
        },
        {
          model: Payment,
          attributes: ["id", "amount", "discount", "method", "collectedAt", "comments"],
          required: false,
        },
        {
          model: Subscription,
          include: [{ model: Plan }],
          required: false,
        },
      ],
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Calculate total paid (sum of all payments and discounts)
    const totalPaid =
      invoice.Payments?.reduce(
        (sum, payment) =>
          sum + (parseFloat(payment.amount) || 0) + (parseFloat(payment.discount) || 0),
        0
      ) || 0;
    const balance = Math.max(
      0,
      Math.round(((invoice.amountTotal || 0) - totalPaid) * 100) / 100
    );

    res.json({
      success: true,
      data: {
        ...invoice.toJSON(),
        totalPaid,
        balance,
        amountDue: balance,
      },
    });
  } catch (error) {
    console.error("Error fetching invoice details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoice details",
      error: error.message,
    });
  }
};
