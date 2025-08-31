const { PendingCharge, Customer, User, Invoice } = require("../models");

// Get pending charges for a customer
const getCustomerPendingCharges = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { companyId } = req.user;

    const pendingCharges = await PendingCharge.findAll({
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
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: pendingCharges,
    });
  } catch (error) {
    console.error("Error fetching pending charges:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending charges",
      error: error.message,
    });
  }
};

// Create a new pending charge
const createPendingCharge = async (req, res) => {
  try {
    const { companyId, id: createdBy } = req.user;
    const { customerId, chargeType, description, amount } = req.body;

    const pendingCharge = await PendingCharge.create({
      companyId,
      customerId,
      chargeType,
      description,
      amount,
      createdBy,
    });

    res.status(201).json({
      success: true,
      data: pendingCharge,
    });
  } catch (error) {
    console.error("Error creating pending charge:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create pending charge",
      error: error.message,
    });
  }
};

// Update a pending charge
const updatePendingCharge = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;
    const { chargeType, description, amount } = req.body;

    const pendingCharge = await PendingCharge.findOne({
      where: {
        id,
        companyId,
        isActive: true,
      },
    });

    if (!pendingCharge) {
      return res.status(404).json({
        success: false,
        message: "Pending charge not found",
      });
    }

    if (pendingCharge.isApplied) {
      return res.status(400).json({
        success: false,
        message: "Cannot update an already applied pending charge",
      });
    }

    await pendingCharge.update({
      chargeType,
      description,
      amount,
    });

    res.json({
      success: true,
      data: pendingCharge,
    });
  } catch (error) {
    console.error("Error updating pending charge:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update pending charge",
      error: error.message,
    });
  }
};

// Delete a pending charge
const deletePendingCharge = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const pendingCharge = await PendingCharge.findOne({
      where: {
        id,
        companyId,
        isActive: true,
      },
    });

    if (!pendingCharge) {
      return res.status(404).json({
        success: false,
        message: "Pending charge not found",
      });
    }

    if (pendingCharge.isApplied) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete an already applied pending charge",
      });
    }

    await pendingCharge.update({ isActive: false });

    res.json({
      success: true,
      message: "Pending charge deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting pending charge:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete pending charge",
      error: error.message,
    });
  }
};

// Get pending charges summary for a customer
const getCustomerPendingChargesSummary = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { companyId } = req.user;

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
        totalPendingAmount,
        pendingChargesCount: pendingCharges.length,
        pendingCharges,
      },
    });
  } catch (error) {
    console.error("Error fetching pending charges summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending charges summary",
      error: error.message,
    });
  }
};

module.exports = {
  getCustomerPendingCharges,
  createPendingCharge,
  updatePendingCharge,
  deletePendingCharge,
  getCustomerPendingChargesSummary,
};
