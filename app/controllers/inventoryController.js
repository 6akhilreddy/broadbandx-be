const { Op } = require("sequelize");
const sequelize = require("../config/db");
const {
  Inventory,
  InventoryLog,
  CustomerHardware,
  Customer,
  User,
} = require("../models");

// Helper to normalize MAC address format XX:XX:XX:XX:XX:XX
const normalizeMac = (mac) => {
  if (!mac) return null;
  const clean = String(mac).replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
  if (clean.length === 12) {
    return `${clean.slice(0, 2)}:${clean.slice(2, 4)}:${clean.slice(
      4,
      6
    )}:${clean.slice(6, 8)}:${clean.slice(8, 10)}:${clean.slice(10, 12)}`;
  }
  return mac.trim().toUpperCase();
};

// 1. Get Inventory list with search, filter, pagination, and KPI summaries
exports.getInventory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      category,
      companyId: queryCompanyId,
    } = req.query;

    const companyId =
      req.user.roleCode === "SUPER_ADMIN" && queryCompanyId
        ? queryCompanyId
        : req.user.companyId;

    if (!companyId && req.user.roleCode !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Company ID is required",
      });
    }

    const where = { isActive: true };
    if (companyId) {
      where.companyId = companyId;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (category && category !== "ALL" && category !== "All Types") {
      where.category = category;
    }

    // Customer search condition if search is provided
    let customerIncludeWhere = undefined;

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { macAddress: { [Op.iLike]: q } },
        { ipAddress: { [Op.iLike]: q } },
        { serialNumber: { [Op.iLike]: q } },
        { membershipNumber: { [Op.iLike]: q } },
        { deviceName: { [Op.iLike]: q } },
        { "$Customer.fullName$": { [Op.iLike]: q } },
        { "$Customer.customerCode$": { [Op.iLike]: q } },
        { "$Customer.phone$": { [Op.iLike]: q } },
      ];
    }

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const pageLimit = parseInt(limit, 10);

    const { rows: items, count: total } = await Inventory.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: "Customer",
          attributes: ["id", "fullName", "phone", "customerCode", "address"],
          required: false,
        },
        {
          model: CustomerHardware,
          as: "CustomerHardware",
          attributes: ["id", "deviceType", "macAddress", "ipAddress"],
          required: false,
        },
      ],
      order: [
        ["status", "ASC"],
        ["updatedAt", "DESC"],
      ],
      limit: pageLimit,
      offset,
      distinct: true,
    });

    // Compute KPI counts across all items in company
    const statsWhere = { isActive: true };
    if (companyId) statsWhere.companyId = companyId;

    const allInventory = await Inventory.findAll({
      where: statsWhere,
      attributes: ["status", "category"],
      raw: true,
    });

    const stats = {
      available: 0,
      withCustomers: 0,
      faulty: 0,
      underRepair: 0,
      retired: 0,
    };

    const categoryMap = {};

    allInventory.forEach((item) => {
      // KPI counts
      if (item.status === "AVAILABLE") stats.available++;
      else if (item.status === "WITH_CUSTOMER") stats.withCustomers++;
      else if (item.status === "FAULTY") stats.faulty++;
      else if (item.status === "UNDER_REPAIR") stats.underRepair++;
      else if (item.status === "RETIRED") stats.retired++;

      // Category breakdown
      const cat = item.category || "Router";
      if (!categoryMap[cat]) {
        categoryMap[cat] = {
          category: cat,
          available: 0,
          issued: 0,
          faulty: 0,
        };
      }
      if (item.status === "AVAILABLE") categoryMap[cat].available++;
      else if (item.status === "WITH_CUSTOMER") categoryMap[cat].issued++;
      else if (item.status === "FAULTY") categoryMap[cat].faulty++;
    });

    const stockByCategory = Object.values(categoryMap);

    return res.json({
      success: true,
      data: {
        items,
        total,
        page: parseInt(page, 10),
        totalPages: Math.ceil(total / pageLimit),
        stats,
        stockByCategory,
      },
    });
  } catch (error) {
    console.error("Get inventory error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve inventory items",
      error: error.message,
    });
  }
};

// 2. Get Available stock (for customer add & replace modals)
exports.getAvailableInventory = async (req, res) => {
  try {
    const { category, search, companyId: queryCompanyId } = req.query;
    const companyId =
      req.user.roleCode === "SUPER_ADMIN" && queryCompanyId
        ? queryCompanyId
        : req.user.companyId;

    const where = {
      isActive: true,
      status: "AVAILABLE",
    };
    if (companyId) where.companyId = companyId;

    if (category && category !== "ALL" && category !== "All Types") {
      where.category = category;
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { macAddress: { [Op.iLike]: q } },
        { ipAddress: { [Op.iLike]: q } },
        { serialNumber: { [Op.iLike]: q } },
        { membershipNumber: { [Op.iLike]: q } },
        { deviceName: { [Op.iLike]: q } },
      ];
    }

    const items = await Inventory.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: 50,
    });

    return res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Get available inventory error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve available inventory",
      error: error.message,
    });
  }
};

// 3. Get single inventory item with audit logs
exports.getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Inventory.findByPk(id, {
      include: [
        {
          model: Customer,
          as: "Customer",
          attributes: ["id", "fullName", "phone", "customerCode", "address"],
        },
        {
          model: CustomerHardware,
          as: "CustomerHardware",
        },
        {
          model: InventoryLog,
          as: "Logs",
          include: [
            {
              model: Customer,
              as: "Customer",
              attributes: ["id", "fullName", "customerCode"],
            },
            {
              model: User,
              as: "Performer",
              attributes: ["id", "name", "email"],
            },
          ],
          order: [["createdAt", "DESC"]],
        },
      ],
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Hardware item not found",
      });
    }

    return res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Get inventory item error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve inventory item",
      error: error.message,
    });
  }
};

// 4. Create new hardware inventory item
exports.createHardware = async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  try {
    const {
      category = "Router",
      deviceName,
      macAddress,
      ipAddress,
      serialNumber,
      membershipNumber,
      purchaseCost,
      notes,
      status = "AVAILABLE",
    } = req.body;

    if (!macAddress) {
      await dbTransaction.rollback();
      return res.status(400).json({
        success: false,
        message: "MAC Address is required",
      });
    }

    const companyId = req.user.companyId;
    if (!companyId && req.user.roleCode !== "SUPER_ADMIN") {
      await dbTransaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Company ID is missing",
      });
    }

    const formattedMac = normalizeMac(macAddress);

    // Check if MAC already exists in company
    const existing = await Inventory.findOne({
      where: {
        macAddress: formattedMac,
        companyId: companyId || req.body.companyId,
      },
    });

    if (existing) {
      await dbTransaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Hardware with MAC address ${formattedMac} already exists in inventory`,
      });
    }

    const newItem = await Inventory.create(
      {
        companyId: companyId || req.body.companyId,
        category: category || "Router",
        deviceName: deviceName || null,
        macAddress: formattedMac,
        ipAddress: ipAddress ? ipAddress.trim() : null,
        serialNumber: serialNumber ? serialNumber.trim() : null,
        membershipNumber: membershipNumber ? membershipNumber.trim() : null,
        purchaseCost: purchaseCost ? parseFloat(purchaseCost) : null,
        notes: notes ? notes.trim() : null,
        status: status || "AVAILABLE",
        isActive: true,
      },
      { transaction: dbTransaction }
    );

    // Record creation log
    await InventoryLog.create(
      {
        companyId: newItem.companyId,
        inventoryId: newItem.id,
        action: "CREATED",
        newStatus: newItem.status,
        performedBy: req.user.id,
        notes: "Device added to inventory",
      },
      { transaction: dbTransaction }
    );

    await dbTransaction.commit();

    return res.status(201).json({
      success: true,
      message: "Hardware added successfully",
      data: newItem,
    });
  } catch (error) {
    await dbTransaction.rollback();
    console.error("Create hardware error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add hardware",
    });
  }
};

// 5. Update hardware inventory item
exports.updateHardware = async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const item = await Inventory.findByPk(id);

    if (!item) {
      await dbTransaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Hardware item not found",
      });
    }

    const {
      category,
      deviceName,
      macAddress,
      ipAddress,
      serialNumber,
      membershipNumber,
      purchaseCost,
      notes,
      status,
    } = req.body;

    const previousStatus = item.status;
    const formattedMac = macAddress ? normalizeMac(macAddress) : item.macAddress;

    // Check unique MAC if changed
    if (formattedMac !== item.macAddress) {
      const existing = await Inventory.findOne({
        where: {
          macAddress: formattedMac,
          companyId: item.companyId,
          id: { [Op.ne]: id },
        },
      });
      if (existing) {
        await dbTransaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Hardware with MAC ${formattedMac} already exists`,
        });
      }
    }

    await item.update(
      {
        category: category !== undefined ? category : item.category,
        deviceName: deviceName !== undefined ? deviceName : item.deviceName,
        macAddress: formattedMac,
        ipAddress: ipAddress !== undefined ? ipAddress : item.ipAddress,
        serialNumber:
          serialNumber !== undefined ? serialNumber : item.serialNumber,
        membershipNumber:
          membershipNumber !== undefined
            ? membershipNumber
            : item.membershipNumber,
        purchaseCost:
          purchaseCost !== undefined ? purchaseCost : item.purchaseCost,
        notes: notes !== undefined ? notes : item.notes,
        status: status !== undefined ? status : item.status,
      },
      { transaction: dbTransaction }
    );

    // If status changed, record log
    if (status && status !== previousStatus) {
      await InventoryLog.create(
        {
          companyId: item.companyId,
          inventoryId: item.id,
          customerId: item.customerId,
          action: "STATUS_CHANGE",
          previousStatus,
          newStatus: status,
          performedBy: req.user.id,
          notes: notes || `Status changed from ${previousStatus} to ${status}`,
        },
        { transaction: dbTransaction }
      );
    }

    await dbTransaction.commit();

    return res.json({
      success: true,
      message: "Hardware updated successfully",
      data: item,
    });
  } catch (error) {
    await dbTransaction.rollback();
    console.error("Update hardware error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update hardware",
      error: error.message,
    });
  }
};

// 6. Delete / Deactivate hardware
exports.deleteHardware = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Inventory.findByPk(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Hardware item not found",
      });
    }

    if (item.status === "WITH_CUSTOMER" && item.customerId) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete hardware currently issued to a customer. Replace or unassign first.",
      });
    }

    await item.update({ isActive: false });

    await InventoryLog.create({
      companyId: item.companyId,
      inventoryId: item.id,
      action: "DELETED",
      performedBy: req.user.id,
      notes: "Hardware marked as inactive / removed",
    });

    return res.json({
      success: true,
      message: "Hardware removed from active inventory",
    });
  } catch (error) {
    console.error("Delete hardware error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete hardware",
      error: error.message,
    });
  }
};

// 7. Replace Hardware for a customer
exports.replaceHardware = async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  try {
    const { id } = req.params; // current inventory item id
    const { replacementInventoryId, markFaulty = false, notes } = req.body;

    if (!replacementInventoryId) {
      await dbTransaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Please select a replacement hardware device",
      });
    }

    const currentDevice = await Inventory.findByPk(id, {
      transaction: dbTransaction,
    });

    if (!currentDevice) {
      await dbTransaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Current hardware device not found",
      });
    }

    const replacementDevice = await Inventory.findByPk(
      replacementInventoryId,
      {
        transaction: dbTransaction,
      }
    );

    if (!replacementDevice) {
      await dbTransaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Replacement hardware device not found",
      });
    }

    if (replacementDevice.status !== "AVAILABLE") {
      await dbTransaction.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Selected replacement device is no longer available. Please select another.",
      });
    }

    const customerId = currentDevice.customerId;
    const oldStatus = currentDevice.status;
    const targetOldStatus = markFaulty ? "FAULTY" : "AVAILABLE";

    // 1. Update old device: unassign from customer, set status
    await currentDevice.update(
      {
        status: targetOldStatus,
        customerId: null,
      },
      { transaction: dbTransaction }
    );

    // 2. Update replacement device: assign to customer, set status
    await replacementDevice.update(
      {
        status: "WITH_CUSTOMER",
        customerId: customerId,
      },
      { transaction: dbTransaction }
    );

    // 3. Update or create CustomerHardware record for the customer
    if (customerId) {
      const existingCustomerHw = await CustomerHardware.findOne({
        where: { customerId, inventoryId: currentDevice.id },
        transaction: dbTransaction,
      });

      if (existingCustomerHw) {
        await existingCustomerHw.update(
          {
            inventoryId: replacementDevice.id,
            deviceType: replacementDevice.category || "Router",
            macAddress: replacementDevice.macAddress,
            ipAddress: replacementDevice.ipAddress,
            membershipNumber: replacementDevice.membershipNumber,
          },
          { transaction: dbTransaction }
        );
      } else {
        await CustomerHardware.create(
          {
            customerId,
            inventoryId: replacementDevice.id,
            deviceType: replacementDevice.category || "Router",
            macAddress: replacementDevice.macAddress,
            ipAddress: replacementDevice.ipAddress,
            membershipNumber: replacementDevice.membershipNumber,
          },
          { transaction: dbTransaction }
        );
      }
    }

    // 4. Log replacement on old device
    await InventoryLog.create(
      {
        companyId: currentDevice.companyId,
        inventoryId: currentDevice.id,
        customerId: customerId,
        action: "REPLACED",
        previousStatus: oldStatus,
        newStatus: targetOldStatus,
        replacedByInventoryId: replacementDevice.id,
        performedBy: req.user.id,
        notes:
          notes ||
          `Replaced by ${replacementDevice.macAddress} (Ref ${
            replacementDevice.serialNumber || "N/A"
          })`,
      },
      { transaction: dbTransaction }
    );

    // 5. Log assignment on new device
    await InventoryLog.create(
      {
        companyId: replacementDevice.companyId,
        inventoryId: replacementDevice.id,
        customerId: customerId,
        action: "ASSIGNED",
        previousStatus: "AVAILABLE",
        newStatus: "WITH_CUSTOMER",
        performedBy: req.user.id,
        notes:
          notes ||
          `Assigned as replacement for ${currentDevice.macAddress} (Ref ${
            currentDevice.serialNumber || "N/A"
          })`,
      },
      { transaction: dbTransaction }
    );

    await dbTransaction.commit();

    return res.json({
      success: true,
      message: "Hardware replaced successfully",
      data: {
        oldDevice: currentDevice,
        replacementDevice,
      },
    });
  } catch (error) {
    await dbTransaction.rollback();
    console.error("Replace hardware error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to replace hardware",
      error: error.message,
    });
  }
};
