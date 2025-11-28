const { Op } = require("sequelize");
const Customer = require("../models/Customer");
const CustomerHardware = require("../models/CustomerHardware");
const Subscription = require("../models/Subscription");
const Plan = require("../models/Plan");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const Area = require("../models/Area");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const sequelize = require("../config/db");
const {
  getCurrentBalance,
  generateInvoiceNumber,
  generatePaymentNumber,
} = require("../utils/financeUtils");

// Create Customer with Hardware and Subscription
exports.createCustomer = async (req, res) => {
  const dbTransaction = await sequelize.transaction();

  try {
    const { customer, hardware, subscription } = req.body;

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

    // Create Customer
    const newCustomer = await Customer.create(customer, {
      transaction: dbTransaction,
    });

    // Create CustomerHardware
    if (hardware) {
      hardware.customerId = newCustomer.id;

      // Handle unique fields - convert empty strings to null
      if (hardware.macAddress === "") {
        hardware.macAddress = null;
      }

      await CustomerHardware.create(hardware, { transaction: dbTransaction });
    }

    // Create Subscription
    let newSubscription = null;
    if (subscription) {
      subscription.customerId = newCustomer.id;
      // Add companyId for non-super admin users
      if (req.userRoleCode !== "SUPER_ADMIN" && req.userCompanyId) {
        subscription.companyId = req.userCompanyId;
      }
      newSubscription = await Subscription.create(subscription, {
        transaction: dbTransaction,
      });

      // Generate initial subscription invoice
      if (newSubscription) {
        await generateInitialInvoice(
          newCustomer,
          newSubscription,
          req,
          dbTransaction
        );
      }
    }

    // Commit the transaction
    await dbTransaction.commit();

    res.status(201).json(newCustomer);
  } catch (err) {
    // Rollback the transaction on any error
    await dbTransaction.rollback();
    console.error("Customer creation error:", err);
    res.status(400).json({ error: err.message, details: err.errors });
  }
};

// Helper function to generate initial subscription invoice
const generateInitialInvoice = async (
  customer,
  subscription,
  req,
  dbTransaction
) => {
  try {
    const {
      agreedMonthlyPrice = 0,
      additionalCharge = 0,
      discount = 0,
      billingCycleValue = 1,
      startDate,
    } = subscription;

    // Calculate total amount for the billing cycle
    const baseAmount = agreedMonthlyPrice * billingCycleValue;
    const additionalCharges = additionalCharge * billingCycleValue;
    const totalDiscount = discount * billingCycleValue;

    // Calculate final amount (base + additional charges - discount)
    const subtotal =
      Math.round((baseAmount + additionalCharges - totalDiscount) * 100) / 100;

    // Calculate period start and end
    const periodStart = startDate;
    const periodEnd = new Date(startDate);
    periodEnd.setMonth(periodEnd.getMonth() + billingCycleValue);
    periodEnd.setDate(periodEnd.getDate() - 1); // Last day of the period

    const companyId =
      req.userRoleCode !== "SUPER_ADMIN" && req.userCompanyId
        ? req.userCompanyId
        : customer.companyId;

    // Create transaction for invoice
    const invoiceTransaction = await Transaction.create(
      {
        companyId,
        customerId: customer.id,
        type: "INVOICE",
        direction: "DEBIT",
        amount: subtotal,
        balanceBefore: 0,
        balanceAfter: subtotal,
        description: `Subscription invoice ${periodStart} to ${
          periodEnd.toISOString().split("T")[0]
        }`,
        referenceType: "invoice",
        transactionDate: new Date(),
        createdBy: req.user.id,
      },
      { transaction: dbTransaction }
    );

    // Create invoice document
    const invoiceData = {
      transactionId: invoiceTransaction.id,
      invoiceNumber: generateInvoiceNumber(),
      type: "SUBSCRIPTION",
      companyId,
      customerId: customer.id,
      subscriptionId: subscription.id,
      periodStart: periodStart,
      periodEnd: periodEnd.toISOString().split("T")[0],
      subtotal: subtotal,
      taxAmount: 0,
      discounts: totalDiscount,
      amountTotal: subtotal,
      prevBalance: 0,
      items: [
        {
          name: subscription.Plan?.name || "Subscription",
          quantity: billingCycleValue,
          unitPrice: agreedMonthlyPrice,
          totalAmount: subtotal,
          itemType: "INTERNET_SERVICE",
        },
      ],
      dueDate: periodEnd.toISOString().split("T")[0],
    };

    await Invoice.create(invoiceData, { transaction: dbTransaction });

    console.log(`Invoice created for customer ${customer.id}:`, {
      invoiceNumber: invoiceData.invoiceNumber,
      amount: subtotal,
      billingCycle: billingCycleValue,
      startDate: periodStart,
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw error;
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
    const { rows: customers, count: total } = await Customer.findAndCountAll({
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
          required: renewalStatus ? true : false, // If filtering by renewal, require subscription
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
      distinct: true, // Important when using includes with where clauses
    });

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

    // Filter by payment status if specified (renewal status is already filtered at DB level)
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

      // Apply pagination after filtering (only needed for paymentStatus which is filtered in JavaScript)
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      finalCustomers = finalCustomers.slice(startIndex, endIndex);
    }
    // Note: If only renewalStatus is specified, pagination is already handled by the database query
    // If both renewalStatus and paymentStatus are specified, renewalStatus is filtered at DB level,
    // then paymentStatus is filtered in JS, then pagination is applied

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
          attributes: ["id", "deviceType", "macAddress", "ipAddress"],
        },
        {
          model: Subscription,
          attributes: [
            "id",
            "planId",
            "startDate",
            "agreedMonthlyPrice",
            "billingType",
            "billingCycle",
            "billingCycleValue",
            "additionalCharge",
            "discount",
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
    const { customer, hardware, subscription } = req.body;

    // Verify customer exists (if we're updating anything)
    if (customer || hardware || subscription) {
      const existingCustomer = await Customer.findOne({
        where: { id: req.params.id },
        transaction: dbTransaction,
      });
      if (!existingCustomer) {
        await dbTransaction.rollback();
        return res.status(404).json({ error: "Customer not found" });
      }
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

    // Update Subscription
    if (subscription) {
      // Add companyId for non-super admin users
      if (req.userRoleCode !== "SUPER_ADMIN" && req.userCompanyId) {
        subscription.companyId = req.userCompanyId;
      }

      await Subscription.update(subscription, {
        where: { customerId: req.params.id },
        transaction: dbTransaction,
      });
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
          attributes: ["id", "deviceType", "macAddress", "ipAddress"],
        },
        {
          model: Subscription,
          attributes: [
            "id",
            "planId",
            "startDate",
            "agreedMonthlyPrice",
            "billingType",
            "billingCycle",
            "billingCycleValue",
            "additionalCharge",
            "discount",
            "status",
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
    // Rollback the transaction on any error
    await dbTransaction.rollback();
    console.error("Customer update error:", err);
    res.status(400).json({ error: err.message, details: err.errors });
  }
};

// Delete Customer
exports.deleteCustomer = async (req, res) => {
  try {
    const deleted = await Customer.destroy({ where: { id: req.params.id } });
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
    const { companyId } = req.user;

    const transaction = await Transaction.findOne({
      where: {
        id: transactionId,
        companyId,
        isActive: true,
      },
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
    // Get the latest transaction ID directly
    const latestTransaction = await Transaction.findOne({
      where: {
        customerId: transaction.customerId,
        companyId,
        isActive: true,
      },
      attributes: ["id"],
      order: [
        ["transactionDate", "DESC"],
        ["id", "DESC"],
      ],
      transaction: dbTransaction,
    });

    // Compare IDs as integers to avoid type mismatch issues
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

    // Soft delete transaction (no recalculation needed since it's the latest)
    await transaction.update(
      { isActive: false },
      { transaction: dbTransaction }
    );

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

// Renew subscription - generate new invoice
exports.renewSubscription = async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  try {
    const { customerId } = req.params;
    const { companyId, id: createdBy } = req.user;

    // Verify customer exists
    const customer = await Customer.findOne({
      where: {
        id: customerId,
        companyId,
      },
      include: [
        {
          model: Subscription,
          where: { status: "ACTIVE" },
          include: [{ model: Plan }],
        },
      ],
    });

    if (!customer || !customer.Subscriptions?.[0]) {
      return res.status(404).json({
        success: false,
        message: "Customer or active subscription not found",
      });
    }

    const subscription = customer.Subscriptions[0];
    const plan = subscription.Plan;

    // Get current balance (prev balance)
    const prevBalance = await getCurrentBalance(customerId, companyId);

    // Calculate new period
    const currentDate = new Date();
    const periodStart =
      subscription.nextRenewalDate || currentDate.toISOString().split("T")[0];
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + subscription.billingCycleValue);
    periodEnd.setDate(periodEnd.getDate() - 1);

    // Calculate invoice amount
    const baseAmount =
      subscription.agreedMonthlyPrice * subscription.billingCycleValue;
    const additionalCharges =
      subscription.additionalCharge * subscription.billingCycleValue;
    const totalDiscount =
      subscription.discount * subscription.billingCycleValue;
    const subtotal =
      Math.round((baseAmount + additionalCharges - totalDiscount) * 100) / 100;
    const amountTotal = subtotal + prevBalance;

    // Update subscription renewal dates
    const newNextRenewalDate = new Date(periodEnd);
    newNextRenewalDate.setDate(newNextRenewalDate.getDate() + 1);

    await subscription.update(
      {
        lastRenewalDate: periodStart,
        nextRenewalDate: newNextRenewalDate.toISOString().split("T")[0],
      },
      { transaction: dbTransaction }
    );

    // Create transaction for invoice
    const invoiceTransaction = await Transaction.create(
      {
        companyId,
        customerId,
        type: "INVOICE",
        direction: "DEBIT",
        amount: amountTotal,
        balanceBefore: prevBalance,
        balanceAfter: prevBalance + subtotal,
        description: `Subscription invoice ${periodStart} to ${
          periodEnd.toISOString().split("T")[0]
        }`,
        referenceType: "invoice",
        transactionDate: new Date(),
        createdBy,
      },
      { transaction: dbTransaction }
    );

    // Create invoice document
    const invoiceItems = [
      {
        name: plan?.name || "Subscription",
        quantity: subscription.billingCycleValue,
        unitPrice: subscription.agreedMonthlyPrice,
        totalAmount: subtotal,
        itemType: "INTERNET_SERVICE",
      },
    ];

    if (prevBalance > 0) {
      invoiceItems.push({
        name: "Previous Balance",
        quantity: 1,
        unitPrice: prevBalance,
        totalAmount: prevBalance,
        itemType: "PREV_BALANCE",
      });
    }

    const invoice = await Invoice.create(
      {
        transactionId: invoiceTransaction.id,
        invoiceNumber: generateInvoiceNumber(),
        type: "SUBSCRIPTION",
        companyId,
        customerId,
        subscriptionId: subscription.id,
        periodStart: periodStart,
        periodEnd: periodEnd.toISOString().split("T")[0],
        subtotal: subtotal,
        taxAmount: 0,
        discounts: totalDiscount,
        amountTotal: amountTotal,
        prevBalance: prevBalance,
        items: invoiceItems,
        dueDate: periodEnd.toISOString().split("T")[0],
      },
      { transaction: dbTransaction }
    );

    // Update transaction reference
    await invoiceTransaction.update(
      { referenceId: invoice.id },
      { transaction: dbTransaction }
    );

    await dbTransaction.commit();

    res.status(201).json({
      success: true,
      data: {
        transaction: invoiceTransaction.toJSON(),
        invoice: invoice.toJSON(),
        subscription: subscription.toJSON(),
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
    const newBalance = currentBalance + amountTotal;

    // Create transaction for invoice
    const invoiceTransaction = await Transaction.create(
      {
        companyId,
        customerId,
        type: "INVOICE",
        direction: "DEBIT",
        amount: amountTotal,
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
        subtotal: subtotal + prevBalance + additionalAmount,
        taxAmount: 0,
        discounts: 0,
        amountTotal: amountTotal,
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

    // Create or update subscriptions for the customer
    const createdSubscriptions = [];
    if (subscriptions && subscriptions.length > 0) {
      for (const subData of subscriptions) {
        const { planId, monthlyPrice } = subData;

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
                lastRenewalDate: periodStart,
                nextRenewalDate: periodEnd,
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
                startDate: periodStart,
                lastRenewalDate: periodStart,
                nextRenewalDate: periodEnd,
                agreedMonthlyPrice: monthlyPrice || plan.monthlyPrice,
                billingType: "POSTPAID",
                billingCycle: "MONTHLY",
                billingCycleValue: 1,
                additionalCharge: 0,
                discount: 0,
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
          include: [
            {
              model: Payment,
              attributes: ["id", "amount", "method", "collectedAt", "comments"],
            },
          ],
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

    // Calculate total paid (sum of all payments)
    const totalPaid =
      invoice.Transaction?.Payments?.reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0
      ) || 0;
    const balance = invoice.amountTotal - totalPaid;

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
