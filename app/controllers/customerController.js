const { Op } = require("sequelize");
const Customer = require("../models/Customer");
const CustomerHardware = require("../models/CustomerHardware");
const Subscription = require("../models/Subscription");
const Plan = require("../models/Plan");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const Area = require("../models/Area");
const PendingCharge = require("../models/PendingCharge");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const sequelize = require("../config/db");

// Create Customer with Hardware and Subscription
exports.createCustomer = async (req, res) => {
  const transaction = await sequelize.transaction();

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
    const newCustomer = await Customer.create(customer, { transaction });

    // Create CustomerHardware
    if (hardware) {
      hardware.customerId = newCustomer.id;

      // Handle unique fields - convert empty strings to null
      if (hardware.macAddress === "") {
        hardware.macAddress = null;
      }

      await CustomerHardware.create(hardware, { transaction });
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
        transaction,
      });

      // Generate invoice and record initial payment
      if (newSubscription) {
        await generateInitialInvoiceAndPayment(
          newCustomer,
          newSubscription,
          req,
          transaction
        );
      }
    }

    // Commit the transaction
    await transaction.commit();

    res.status(201).json(newCustomer);
  } catch (err) {
    // Rollback the transaction on any error
    await transaction.rollback();
    console.error("Customer creation error:", err);
    res.status(400).json({ error: err.message, details: err.errors });
  }
};

// Helper function to generate initial invoice and payment
const generateInitialInvoiceAndPayment = async (
  customer,
  subscription,
  req,
  transaction
) => {
  try {
    // Calculate invoice amount based on subscription details
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

    // Set due date to start date (advance payment)
    const dueDate = startDate;

    // Calculate period start and end
    const periodStart = startDate;
    const periodEnd = new Date(startDate);
    periodEnd.setMonth(periodEnd.getMonth() + billingCycleValue);
    periodEnd.setDate(periodEnd.getDate() - 1); // Last day of the period

    // Create invoice
    const invoiceData = {
      companyId:
        req.userRoleCode !== "SUPER_ADMIN" && req.userCompanyId
          ? req.userCompanyId
          : customer.companyId,
      customerId: customer.id,
      subscriptionId: subscription.id,
      periodStart: periodStart,
      periodEnd: periodEnd.toISOString().split("T")[0],
      subtotal: subtotal,
      taxAmount: 0, // No tax for initial invoice
      discounts: totalDiscount,
      amountTotal: subtotal,
      dueDate: dueDate,
      status: "PAID", // Mark as paid since it's advance payment
    };

    const newInvoice = await Invoice.create(invoiceData, { transaction });

    // Record the advance payment
    const paymentData = {
      companyId:
        req.userRoleCode !== "SUPER_ADMIN" && req.userCompanyId
          ? req.userCompanyId
          : customer.companyId,
      invoiceId: newInvoice.id,
      collectedBy: req.user.id, // Current user who created the customer
      collectedAt: new Date(),
      method: "CASH", // Default method, can be updated later
      amount: subtotal,
      comments: `Advance payment for ${billingCycleValue} month(s) subscription starting ${startDate}`,
    };

    await Payment.create(paymentData, { transaction });

    console.log(`Invoice and payment created for customer ${customer.id}:`, {
      invoiceId: newInvoice.id,
      amount: subtotal,
      billingCycle: billingCycleValue,
      startDate: startDate,
    });
  } catch (error) {
    console.error("Error generating invoice and payment:", error);
    throw error;
  }
};

// Get all Customers with Hardware, Plan, Subscription, and Payment details
exports.getAllCustomers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      areaId,
      paymentStatus,
      dueDateFrom,
      dueDateTo,
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

    // Due date filter
    let invoiceWhere = {};
    if (dueDateFrom || dueDateTo) {
      invoiceWhere.dueDate = {};
      if (dueDateFrom) {
        invoiceWhere.dueDate[Op.gte] = dueDateFrom;
      }
      if (dueDateTo) {
        invoiceWhere.dueDate[Op.lte] = dueDateTo;
      }
    }

    // Payment status filter - we'll handle this after getting the data
    // since it requires calculating balance which is done in the transformation

    // Fetch customers with all related data
    const { rows: customers, count: total } = await Customer.findAndCountAll({
      attributes: [
        "id",
        "fullName",
        "phone",
        "address",
        "customerCode",
        "isActive",
        "createdAt",
      ],
      where: whereCondition,
      include: [
        {
          model: CustomerHardware,
          attributes: ["ipAddress", "macAddress"],
          required: false,
        },
        {
          model: Area,
          attributes: ["areaName"],
          required: false,
        },
        {
          model: Subscription,
          attributes: ["agreedMonthlyPrice"],
          required: false,
          include: [
            {
              model: Plan,
              attributes: ["name", "monthlyPrice"],
              required: false,
            },
          ],
        },
        {
          model: Invoice,
          attributes: ["dueDate", "amountTotal", "subtotal", "taxAmount"],
          required: false,
          where: invoiceWhere,
          order: [["createdAt", "DESC"]],
          limit: 1,
          include: [
            {
              model: Payment,
              attributes: ["amount"],
              required: false,
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      // Don't apply limit/offset if we're filtering by payment status
      // because we need to filter after calculating balance
      ...(paymentStatus ? {} : { limit: parseInt(limit), offset: offset }),
    });

    // Transform the data
    let transformedCustomers = customers.map((customer) => {
      const hardware = customer.CustomerHardwares?.[0] || {};
      const subscription = customer.Subscriptions?.[0] || {};
      const latestInvoice = customer.Invoices?.[0];
      const invoicePayment = latestInvoice?.Payments?.[0];

      // Calculate balance
      let balance = 0;
      if (latestInvoice) {
        balance =
          Math.round(
            (latestInvoice.amountTotal - (invoicePayment?.amount || 0)) * 100
          ) / 100;
      }

      return {
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone,
        address: customer.address,
        customerCode: customer.customerCode,
        isActive: customer.isActive,
        areaName: customer.Area?.areaName, // Using areaName from Area model
        ipAddress: hardware.ipAddress,
        macAddress: hardware.macAddress,
        planName: subscription.Plan?.name,
        agreedMonthlyPrice: subscription.agreedMonthlyPrice,
        monthlyPrice: subscription.Plan?.monthlyPrice,
        dueDate: latestInvoice?.dueDate,
        balance: balance,
      };
    });

    // Filter by payment status if specified
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

      // Apply pagination after filtering
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
        {
          model: Invoice,
          attributes: [
            "id",
            "dueDate",
            "amountTotal",
            "subtotal",
            "taxAmount",
            "createdAt",
          ],
          order: [["createdAt", "DESC"]],
          limit: 1,
          include: [
            {
              model: Payment,
              attributes: ["id", "amount", "method", "createdAt"],
            },
          ],
        },
      ],
    });

    if (!customer) return res.status(404).json({ error: "Customer not found" });

    // Get the latest invoice and payment
    const latestInvoice = customer.Invoices?.[0];
    const invoicePayment = latestInvoice?.Payments?.[0];

    // Calculate balance
    let balance = 0;
    if (latestInvoice) {
      balance =
        Math.round(
          (latestInvoice.amountTotal - (invoicePayment?.amount || 0)) * 100
        ) / 100;
    }

    // Transform the response
    const transformedCustomer = {
      ...customer.toJSON(),
      area: customer.Area
        ? {
            id: customer.Area.id,
            areaName: customer.Area.areaName,
          }
        : null,
      hardware: customer.CustomerHardware?.[0] || null,
      subscription: customer.Subscription?.[0]
        ? {
            ...customer.Subscription[0].toJSON(),
            plan: customer.Subscription[0].Plan
              ? {
                  name: customer.Subscription[0].Plan.name,
                  monthlyPrice: customer.Subscription[0].Plan.monthlyPrice,
                  code: customer.Subscription[0].Plan.code,
                  benefits: customer.Subscription[0].Plan.benefits,
                }
              : null,
          }
        : null,
      latestInvoice: latestInvoice
        ? {
            id: latestInvoice.id,
            dueDate: latestInvoice.dueDate,
            amountTotal: latestInvoice.amountTotal,
            subtotal: latestInvoice.subtotal,
            taxAmount: latestInvoice.taxAmount,
            createdAt: latestInvoice.createdAt,
            balance: balance,
            lastPayment: invoicePayment
              ? {
                  id: invoicePayment.id,
                  amount: invoicePayment.amount,
                  method: invoicePayment.method,
                  date: invoicePayment.createdAt,
                }
              : null,
          }
        : null,
    };

    res.json(transformedCustomer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Customer with Hardware and Subscription
exports.updateCustomer = async (req, res) => {
  const transaction = await sequelize.transaction();

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

    // Update Customer
    const [updated] = await Customer.update(customer, {
      where: { id: req.params.id },
      transaction,
    });
    if (!updated) return res.status(404).json({ error: "Customer not found" });

    // Update CustomerHardware
    if (hardware) {
      // Handle unique fields - convert empty strings to null
      if (hardware.macAddress === "") {
        hardware.macAddress = null;
      }

      await CustomerHardware.update(hardware, {
        where: { customerId: req.params.id },
        transaction,
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
        transaction,
      });
    }

    // Commit the transaction
    await transaction.commit();

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
    await transaction.rollback();
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

// Add pending charge to customer
exports.addPendingCharge = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { customerId } = req.params;
    const { companyId, id: createdBy } = req.user;
    const { chargeType, description, amount } = req.body;

    // Verify customer exists and belongs to company
    const customer = await Customer.findOne({
      where: {
        id: customerId,
        companyId,
        isActive: true,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Create pending charge
    const pendingCharge = await PendingCharge.create(
      {
        companyId,
        customerId,
        chargeType,
        description,
        amount,
        createdBy,
      },
      { transaction }
    );

    // Create transaction record for pending charge
    const latestTransaction = await Transaction.findOne({
      where: {
        customerId,
        companyId,
        isActive: true,
      },
      order: [["transactionDate", "DESC"]],
    });

    const balanceBefore = latestTransaction?.balanceAfter || 0;
    const balanceAfter = balanceBefore; // Pending charges don't affect current balance

    await Transaction.create(
      {
        companyId,
        customerId,
        type: "PENDING_CHARGE_ADDED",
        amount: amount,
        balanceBefore,
        balanceAfter,
        description: `Pending charge added: ${description}`,
        referenceId: pendingCharge.id,
        referenceType: "pending_charge",
        createdBy,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      data: pendingCharge,
      message: "Pending charge added successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error adding pending charge:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add pending charge",
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
        isActive: true,
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
          attributes: ["id", "fullName"],
        },
      ],
      order: [["transactionDate", "DESC"]],
    });

    // Get pending charges
    const pendingCharges = await PendingCharge.findAll({
      where: {
        customerId,
        companyId,
        isActive: true,
        isApplied: false,
      },
    });

    const totalPendingAmount = pendingCharges.reduce(
      (sum, charge) => sum + charge.amount,
      0
    );

    res.json({
      success: true,
      data: {
        transactions,
        pendingCharges: {
          totalAmount: totalPendingAmount,
          charges: pendingCharges,
        },
        currentBalance: transactions[0]?.balanceAfter || 0,
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

// Test endpoint to check data structure
exports.testCustomerData = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { id: 1 }, // Test with first customer
      include: [
        {
          model: CustomerHardware,
          attributes: ["ipAddress", "macAddress"],
          required: false,
        },
        {
          model: Area,
          attributes: ["areaName"],
          required: false,
        },
        {
          model: Subscription,
          attributes: ["agreedMonthlyPrice"],
          required: false,
          include: [
            {
              model: Plan,
              attributes: ["name", "monthlyPrice"],
              required: false,
            },
          ],
        },
      ],
    });

    if (!customer) {
      return res.status(404).json({ error: "No customer found" });
    }

    res.json({
      rawCustomer: customer.toJSON(),
      hardware: customer.CustomerHardware,
      subscription: customer.Subscription,
      area: customer.Area,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
