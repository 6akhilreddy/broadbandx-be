const { Op } = require("sequelize");
const Customer = require("../models/Customer");
const CustomerHardware = require("../models/CustomerHardware");
const Subscription = require("../models/Subscription");
const Plan = require("../models/Plan");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const Area = require("../models/Area");

// Create Customer with Hardware and Subscription
exports.createCustomer = async (req, res) => {
  try {
    const { customer, hardware, subscription } = req.body;

    // Add companyId for non-super admin users
    if (req.userRoleCode !== "SUPER_ADMIN" && req.userCompanyId) {
      customer.companyId = req.userCompanyId;
    }

    // Create Customer
    const newCustomer = await Customer.create(customer);
    // Create CustomerHardware
    if (hardware) {
      hardware.customerId = newCustomer.id;
      await CustomerHardware.create(hardware);
    }
    // Create Subscription
    if (subscription) {
      subscription.customerId = newCustomer.id;
      // Add companyId for non-super admin users
      if (req.userRoleCode !== "SUPER_ADMIN" && req.userCompanyId) {
        subscription.companyId = req.userCompanyId;
      }
      await Subscription.create(subscription);
    }
    res.status(201).json(newCustomer);
  } catch (err) {
    console.error("Customer creation error:", err);
    res.status(400).json({ error: err.message, details: err.errors });
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
          attributes: ["dueDate", "amountTotal", "amountDue", "taxAmount"],
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
            "amountDue",
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
            amountDue: latestInvoice.amountDue,
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

// Update Customer
exports.updateCustomer = async (req, res) => {
  try {
    const { customer, hardware, subscription } = req.body;
    const [updated] = await Customer.update(customer, {
      where: { id: req.params.id },
    });
    if (!updated) return res.status(404).json({ error: "Customer not found" });
    // Optionally update hardware and subscription
    if (hardware) {
      await CustomerHardware.update(hardware, {
        where: { customerId: req.params.id },
      });
    }
    if (subscription) {
      await Subscription.update(subscription, {
        where: { customerId: req.params.id },
      });
    }
    const updatedCustomer = await Customer.findByPk(req.params.id);
    res.json(updatedCustomer);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
