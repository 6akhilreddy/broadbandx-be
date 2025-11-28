const { Op } = require("sequelize");
const sequelize = require("../config/db");
const Complaint = require("../models/Complaint");
const ComplaintComment = require("../models/ComplaintComment");
const Customer = require("../models/Customer");
const User = require("../models/User");
const Area = require("../models/Area");
const { Role } = require("../models");

// Create a new complaint
exports.createComplaint = async (req, res) => {
  try {
    const { customerId, message, assignedAgentId, status = "OPEN" } = req.body;
    const { companyId, id: createdBy } = req.user;

    // Verify customer exists and belongs to company
    const customer = await Customer.findOne({
      where: {
        id: customerId,
        companyId,
      },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Verify agent exists and belongs to company (if assigned)
    if (assignedAgentId) {
      const agentRole = await Role.findOne({ where: { code: "AGENT" } });
      if (!agentRole) {
        return res.status(500).json({ error: "Agent role not found" });
      }

      const agent = await User.findOne({
        where: {
          id: assignedAgentId,
          roleId: agentRole.id,
          companyId,
        },
      });

      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
    }

    const complaint = await Complaint.create({
      companyId,
      customerId,
      assignedAgentId: assignedAgentId || null,
      status,
      message,
      createdBy,
    });

    // Fetch complaint with related data
    const complaintWithDetails = await Complaint.findByPk(complaint.id, {
      include: [
        {
          model: Customer,
          attributes: ["id", "fullName", "phone", "address"],
          include: [
            {
              model: Area,
              attributes: ["id", "areaName"],
            },
          ],
        },
        {
          model: User,
          as: "AssignedAgent",
          attributes: ["id", "name", "phone"],
        },
      ],
    });

    res.status(201).json(complaintWithDetails);
  } catch (err) {
    console.error("Create complaint error:", err);
    res.status(400).json({ error: err.message, details: err.errors });
  }
};

// Get all complaints with filters
exports.getAllComplaints = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      assignedAgentId,
      startDate,
      endDate,
    } = req.query;

    // Get company filter
    const companyFilter =
      req.user.roleCode === "SUPER_ADMIN" && req.query.companyId
        ? req.query.companyId
        : req.user.companyId;

    if (!companyFilter && req.user.roleCode !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Company ID is required",
      });
    }

    // Build where clause
    const whereCondition = { companyId: companyFilter };

    // For agents, only show complaints assigned to them
    const isAgent = req.user.roleCode === "AGENT";
    if (isAgent) {
      whereCondition.assignedAgentId = req.user.id;
    }

    if (status) {
      whereCondition.status = status;
    }

    if (assignedAgentId && !isAgent) {
      whereCondition.assignedAgentId = assignedAgentId;
    }

    // Date filters
    if (startDate || endDate) {
      whereCondition.createdAt = {};
      if (startDate) {
        whereCondition.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereCondition.createdAt[Op.lte] = end;
      }
    }

    // Search filter
    let customerWhere = {};
    if (search) {
      customerWhere[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { customerCode: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch complaints with pagination
    const { rows: complaints, count: total } = await Complaint.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Customer,
          attributes: ["id", "fullName", "phone", "address", "customerCode"],
          where: customerWhere,
          required: !!search, // Only require customer if searching
          include: [
            {
              model: Area,
              attributes: ["id", "areaName"],
            },
          ],
        },
        {
          model: User,
          as: "AssignedAgent",
          attributes: ["id", "name", "phone"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    // Transform response
    const transformedComplaints = complaints.map((complaint) => ({
      id: complaint.id,
      customerId: complaint.customerId,
      customerName: complaint.Customer?.fullName || "Unknown",
      customerPhone: complaint.Customer?.phone || "",
      customerAddress: complaint.Customer?.address || "",
      customerCode: complaint.Customer?.customerCode || "",
      areaName: complaint.Customer?.Area?.areaName || "",
      message: complaint.message,
      status: complaint.status,
      assignedAgentId: complaint.assignedAgentId,
      assignedAgentName: complaint.AssignedAgent?.name || null,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
    }));

    const currentPage = parseInt(page);
    const totalPages = Math.ceil(total / limit);

    // Get status counts for all complaints (without filters except company)
    const statusCounts = await Complaint.findAll({
      where: {
        companyId: companyFilter,
        isActive: true,
      },
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });

    // Format status counts
    const counts = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
    };
    statusCounts.forEach((item) => {
      if (item.status && counts.hasOwnProperty(item.status)) {
        counts[item.status] = parseInt(item.count) || 0;
      }
    });

    res.json({
      data: transformedComplaints,
      pagination: {
        totalItems: total,
        currentPage,
        totalPages,
        pageSize: parseInt(limit),
        hasNext: currentPage < totalPages,
        hasPrevious: currentPage > 1,
      },
      statusCounts: counts,
    });
  } catch (err) {
    console.error("Get all complaints error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get complaint by ID
exports.getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    const companyFilter =
      req.user.roleCode === "SUPER_ADMIN" && req.query.companyId
        ? req.query.companyId
        : req.user.companyId;

    const complaint = await Complaint.findOne({
      where: {
        id,
        companyId: companyFilter,
      },
      include: [
        {
          model: Customer,
          attributes: ["id", "fullName", "phone", "address", "customerCode"],
          include: [
            {
              model: Area,
              attributes: ["id", "areaName"],
            },
          ],
        },
        {
          model: User,
          as: "AssignedAgent",
          attributes: ["id", "name", "phone"],
        },
        {
          model: User,
          as: "CreatedBy",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    res.json(complaint);
  } catch (err) {
    console.error("Get complaint by id error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update complaint
exports.updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedAgentId, message } = req.body;
    const { companyId } = req.user;

    // Verify complaint exists
    const complaint = await Complaint.findOne({
      where: {
        id,
        companyId,
      },
    });

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    // Verify agent exists if assigned
    if (assignedAgentId) {
      const agentRole = await Role.findOne({ where: { code: "AGENT" } });
      if (!agentRole) {
        return res.status(500).json({ error: "Agent role not found" });
      }

      const agent = await User.findOne({
        where: {
          id: assignedAgentId,
          roleId: agentRole.id,
          companyId,
        },
      });

      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
    }

    // Build update object with only provided fields
    const updateData = {};

    if (status !== undefined && status !== null) {
      updateData.status = status;
    }

    if (assignedAgentId !== undefined) {
      updateData.assignedAgentId = assignedAgentId || null;
    }

    if (message !== undefined && message !== null) {
      updateData.message = message;
    }

    // Only update if there's data to update
    if (Object.keys(updateData).length > 0) {
      const [affectedRows] = await Complaint.update(updateData, {
        where: { id, companyId },
      });

      if (affectedRows === 0) {
        return res
          .status(404)
          .json({ error: "Complaint not found or no changes made" });
      }
    }

    // Fetch updated complaint
    const updatedComplaint = await Complaint.findByPk(id, {
      include: [
        {
          model: Customer,
          attributes: ["id", "fullName", "phone", "address", "customerCode"],
          include: [
            {
              model: Area,
              attributes: ["id", "areaName"],
            },
          ],
        },
        {
          model: User,
          as: "AssignedAgent",
          attributes: ["id", "name", "phone"],
        },
      ],
    });

    res.json(updatedComplaint);
  } catch (err) {
    console.error("Update complaint error:", err);
    res.status(400).json({ error: err.message, details: err.errors });
  }
};

// Delete complaint (soft delete)
exports.deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const [updated] = await Complaint.update(
      { isActive: false },
      {
        where: {
          id,
          companyId,
        },
      }
    );

    if (!updated) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    res.json({ message: "Complaint deleted successfully" });
  } catch (err) {
    console.error("Delete complaint error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Search customers for complaint creation
exports.searchCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    const { companyId } = req.user;

    if (!search || search.length < 2) {
      return res.json([]);
    }

    const customers = await Customer.findAll({
      where: {
        companyId,
        isActive: true,
        [Op.or]: [
          { fullName: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } },
          { customerCode: { [Op.iLike]: `%${search}%` } },
        ],
      },
      attributes: ["id", "fullName", "phone", "address", "customerCode"],
      include: [
        {
          model: Area,
          attributes: ["id", "areaName"],
        },
      ],
      limit: 20,
      order: [["fullName", "ASC"]],
    });

    res.json(customers);
  } catch (err) {
    console.error("Search customers error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get comments for a complaint
exports.getComplaintComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    // Verify complaint exists and belongs to company
    const complaint = await Complaint.findOne({
      where: {
        id,
        companyId,
      },
    });

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    const comments = await ComplaintComment.findAll({
      where: {
        complaintId: id,
        isActive: true,
      },
      include: [
        {
          model: User,
          as: "CreatedBy",
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(comments);
  } catch (err) {
    console.error("Get complaint comments error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Add comment to a complaint
exports.addComplaintComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const { companyId, id: createdBy } = req.user;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: "Comment is required" });
    }

    // Verify complaint exists and belongs to company
    const complaint = await Complaint.findOne({
      where: {
        id,
        companyId,
      },
    });

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    const newComment = await ComplaintComment.create({
      complaintId: id,
      comment: comment.trim(),
      createdBy,
    });

    // Fetch comment with user details
    const commentWithUser = await ComplaintComment.findByPk(newComment.id, {
      include: [
        {
          model: User,
          as: "CreatedBy",
          attributes: ["id", "name"],
        },
      ],
    });

    res.status(201).json(commentWithUser);
  } catch (err) {
    console.error("Add complaint comment error:", err);
    res.status(400).json({ error: err.message, details: err.errors });
  }
};

// Delete comment
exports.deleteComplaintComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { companyId } = req.user;

    // Verify complaint exists and belongs to company
    const complaint = await Complaint.findOne({
      where: {
        id,
        companyId,
      },
    });

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    // Verify comment exists and belongs to complaint
    const comment = await ComplaintComment.findOne({
      where: {
        id: commentId,
        complaintId: id,
      },
    });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Soft delete
    await ComplaintComment.update(
      { isActive: false },
      {
        where: {
          id: commentId,
          complaintId: id,
        },
      }
    );

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Delete complaint comment error:", err);
    res.status(500).json({ error: err.message });
  }
};
