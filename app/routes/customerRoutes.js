const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");

/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *   tags:
 *     - name: Customers
 *       description: Customer management
 */

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Create a new customer with hardware and subscription
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customer:
 *                 type: object
 *                 properties:
 *                   companyId:
 *                     type: integer
 *                   fullName:
 *                     type: string
 *                   billingName:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   phoneSecondary:
 *                     type: string
 *                   email:
 *                     type: string
 *                   address:
 *                     type: string
 *                   areaId:
 *                     type: integer
 *                   customerCode:
 *                     type: string
 *                   latitude:
 *                     type: string
 *                   longitude:
 *                     type: string
 *                   assignedAgentId:
 *                     type: integer
 *                   installationDate:
 *                     type: string
 *                     format: date
 *                   securityDeposit:
 *                     type: number
 *                   gstNumber:
 *                     type: string
 *                   advance:
 *                     type: integer
 *                   remarks:
 *                     type: string
 *                   createdBy:
 *                     type: integer
 *                   isActive:
 *                     type: boolean
 *               hardware:
 *                 type: object
 *                 properties:
 *                   deviceType:
 *                     type: string
 *                   macAddress:
 *                     type: string
 *                   ipAddress:
 *                     type: string
 *               subscription:
 *                 type: object
 *                 properties:
 *                   companyId:
 *                     type: integer
 *                   customerId:
 *                     type: integer
 *                   planId:
 *                     type: integer
 *                   startDate:
 *                     type: string
 *                     format: date
 *                   agreedMonthlyPrice:
 *                     type: number
 *                   billingType:
 *                     type: string
 *                     enum: [PREPAID, POSTPAID]
 *                   billingCycle:
 *                     type: string
 *                     enum: [MONTHLY, DAILY]
 *                   billingCycleValue:
 *                     type: integer
 *                   additionalCharge:
 *                     type: number
 *                   discount:
 *                     type: number
 *                   status:
 *                     type: string
 *                     enum: [ACTIVE, PAUSED, CANCELLED, CHANGED]
 *           example:
 *             customer:
 *               companyId: 1
 *               fullName: "John Doe"
 *               billingName: "John D."
 *               phone: "9876543210"
 *               phoneSecondary: "9123456789"
 *               email: "john.doe@example.com"
 *               address: "123 Main St, City"
 *               areaId: 2
 *               customerCode: "CUST123"
 *               latitude: "12.9716"
 *               longitude: "77.5946"
 *               assignedAgentId: 5
 *               installationDate: "2025-08-01"
 *               securityDeposit: 1000
 *               gstNumber: "29ABCDE1234F2Z5"
 *               advance: 500
 *               remarks: "VIP customer"
 *               createdBy: 1
 *               isActive: true
 *             hardware:
 *               deviceType: "Router"
 *               macAddress: "00:1A:2B:3C:4D:5E"
 *               ipAddress: "192.168.1.10"
 *             subscription:
 *               companyId: 1
 *               customerId: 1
 *               planId: 3
 *               startDate: "2025-08-01"
 *               agreedMonthlyPrice: 1200
 *               billingType: "POSTPAID"
 *               billingCycle: "MONTHLY"
 *               billingCycleValue: 1
 *               additionalCharge: 100
 *               discount: 50
 *               status: "ACTIVE"
 *     responses:
 *       201:
 *         description: Customer created
 *       400:
 *         description: Bad request
 */
router.post("/", customerController.createCustomer);

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get all customers with their hardware, plan, subscription, and payment details
 *     description: |
 *       Fetch customers with pagination, search, and filtering capabilities.
 *
 *       Example calls:
 *       - Basic pagination: `/customers?page=1&limit=10`
 *       - Search: `/customers?search=john`
 *       - Filter by area: `/customers?areaId=1`
 *       - Filter by payment: `/customers?paymentStatus=unpaid`
 *       - Filter by date: `/customers?dueDateFrom=2025-08-01&dueDateTo=2025-08-31`
 *       - Combined: `/customers?page=1&limit=10&search=john&areaId=1&paymentStatus=unpaid`
 *     tags: [Customers]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *         example: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in fullName, phone, or customerCode fields
 *         example: "john"
 *       - in: query
 *         name: areaId
 *         schema:
 *           type: integer
 *         description: Filter customers by area ID
 *         example: 1
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [paid, unpaid]
 *         description: Filter by payment status (paid = balance is 0, unpaid = balance > 0)
 *         example: "unpaid"
 *       - in: query
 *         name: dueDateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by due date starting from this date (inclusive)
 *         example: "2025-08-01"
 *       - in: query
 *         name: dueDateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by due date up to this date (inclusive)
 *         example: "2025-08-31"
 *     responses:
 *       200:
 *         description: List of customers with related information and pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [data, pagination]
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     required: [id, fullName, customerCode, isActive]
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Unique identifier of the customer
 *                       fullName:
 *                         type: string
 *                         description: Full name of the customer
 *                       phone:
 *                         type: string
 *                         description: Primary phone number
 *                       address:
 *                         type: string
 *                         description: Customer's address
 *                       customerCode:
 *                         type: string
 *                         description: Unique customer code
 *                       isActive:
 *                         type: boolean
 *                         description: Customer's active status
 *                       areaName:
 *                         type: string
 *                         description: Name of the area where customer is located
 *                       ipAddress:
 *                         type: string
 *                         description: IP address of customer's hardware
 *                       macAddress:
 *                         type: string
 *                         description: MAC address of customer's hardware
 *                       planName:
 *                         type: string
 *                         description: Name of the current plan
 *                       planSpeed:
 *                         type: string
 *                         description: Speed of the current plan (e.g., "100 Mbps")
 *                       agreedMonthlyPrice:
 *                         type: number
 *                         description: Monthly subscription price
 *                       billingType:
 *                         type: string
 *                         enum: [PREPAID, POSTPAID]
 *                         description: Type of billing
 *                       dueDate:
 *                         type: string
 *                         format: date
 *                         description: Due date from the latest invoice
 *                       balance:
 *                         type: number
 *                         description: Current balance (0 if paid, otherwise remaining amount)
 *                 pagination:
 *                   type: object
 *                   required: [totalItems, currentPage, pageSize, totalPages, hasNext, hasPrevious]
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                       description: Total number of items across all pages
 *                     currentPage:
 *                       type: integer
 *                       description: Current page number
 *                     pageSize:
 *                       type: integer
 *                       description: Number of items per page
 *                     totalPages:
 *                       type: integer
 *                       description: Total number of pages
 *                     hasNext:
 *                       type: boolean
 *                       description: Whether there is a next page
 *                     hasPrevious:
 *                       type: boolean
 *                       description: Whether there is a previous page
 *             examples:
 *               value:
 *                 data:
 *                   - id: 1
 *                     fullName: "John Doe"
 *                     phone: "9876543210"
 *                     address: "123 Main St, City"
 *                     customerCode: "CUST123"
 *                     isActive: true
 *                     areaName: "Central Business District"
 *                     ipAddress: "192.168.1.10"
 *                     macAddress: "00:1A:2B:3C:4D:5E"
 *                     planName: "Premium"
 *                     planSpeed: "300 Mbps"
 *                     agreedMonthlyPrice: 1200
 *                     billingType: "POSTPAID"
 *                     dueDate: "2025-09-01"
 *                     balance: 0
 *                   - id: 2
 *                     fullName: "Jane Smith"
 *                     phone: "9876543211"
 *                     address: "456 Oak St, City"
 *                     customerCode: "CUST124"
 *                     isActive: true
 *                     areaName: "Suburban Zone"
 *                     ipAddress: "192.168.1.11"
 *                     macAddress: "00:1A:2B:3C:4D:5F"
 *                     planName: "Basic"
 *                     planSpeed: "100 Mbps"
 *                     agreedMonthlyPrice: 800
 *                     billingType: "PREPAID"
 *                     dueDate: "2025-09-01"
 *                     balance: 800
 *                 pagination:
 *                   totalItems: 50
 *                   currentPage: 1
 *                   pageSize: 10
 *                   totalPages: 5
 *                   hasNext: true
 *                   hasPrevious: false
 
 */
router.get("/", customerController.getAllCustomers);

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Get customer by ID with all related details
 *     tags:
 *       - Customers
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer data with all associated details including area, hardware, subscription, plan, latest invoice and payment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 companyId:
 *                   type: integer
 *                 fullName:
 *                   type: string
 *                 billingName:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 phoneSecondary:
 *                   type: string
 *                 email:
 *                   type: string
 *                 address:
 *                   type: string
 *                 areaId:
 *                   type: integer
 *                 customerCode:
 *                   type: string
 *                 latitude:
 *                   type: string
 *                 longitude:
 *                   type: string
 *                 assignedAgentId:
 *                   type: integer
 *                 installationDate:
 *                   type: string
 *                   format: date
 *                 securityDeposit:
 *                   type: number
 *                 gstNumber:
 *                   type: string
 *                 advance:
 *                   type: integer
 *                 remarks:
 *                   type: string
 *                 createdBy:
 *                   type: integer
 *                 isActive:
 *                   type: boolean
 *                 area:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     areaName:
 *                       type: string
 *                 hardware:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     deviceType:
 *                       type: string
 *                     macAddress:
 *                       type: string
 *                     ipAddress:
 *                       type: string
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     planId:
 *                       type: integer
 *                     startDate:
 *                       type: string
 *                       format: date
 *                     agreedMonthlyPrice:
 *                       type: number
 *                     billingType:
 *                       type: string
 *                       enum: [PREPAID, POSTPAID]
 *                     billingCycle:
 *                       type: string
 *                       enum: [MONTHLY, DAILY]
 *                     billingCycleValue:
 *                       type: integer
 *                     additionalCharge:
 *                       type: number
 *                     discount:
 *                       type: number
 *                     status:
 *                       type: string
 *                       enum: [ACTIVE, PAUSED, CANCELLED, CHANGED]
 *                     plan:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           description: Name of the plan
 *                         monthlyPrice:
 *                           type: number
 *                           description: Monthly price of the plan
 *                         code:
 *                           type: string
 *                           description: Plan code
 *                         benefits:
 *                           type: string
 *                           description: Plan benefits description
 *                 latestInvoice:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     dueDate:
 *                       type: string
 *                       format: date
 *                     amountTotal:
 *                       type: number
 *                     amountDue:
 *                       type: number
 *                     taxAmount:
 *                       type: number
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     balance:
 *                       type: number
 *                     lastPayment:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         amount:
 *                           type: number
 *                         paymentMethod:
 *                           type: string
 *                         date:
 *                           type: string
 *                           format: date-time
 *             example:
 *               id: 1
 *               companyId: 1
 *               fullName: "John Doe"
 *               billingName: "John D."
 *               phone: "9876543210"
 *               phoneSecondary: "9123456789"
 *               email: "john.doe@example.com"
 *               address: "123 Main St, City"
 *               areaId: 2
 *               customerCode: "CUST123"
 *               latitude: "12.9716"
 *               longitude: "77.5946"
 *               assignedAgentId: 5
 *               installationDate: "2025-08-01"
 *               securityDeposit: 1000
 *               gstNumber: "29ABCDE1234F2Z5"
 *               advance: 500
 *               remarks: "VIP customer"
 *               createdBy: 1
 *               isActive: true
 *               area:
 *                 id: 2
 *                 areaName: "Central Business District"
 *               hardware:
 *                 id: 1
 *                 deviceType: "Router"
 *                 macAddress: "00:1A:2B:3C:4D:5E"
 *                 ipAddress: "192.168.1.10"
 *               subscription:
 *                 id: 1
 *                 planId: 3
 *                 startDate: "2025-08-01"
 *                 agreedMonthlyPrice: 1200
 *                 billingType: "POSTPAID"
 *                 billingCycle: "MONTHLY"
 *                 billingCycleValue: 1
 *                 additionalCharge: 100
 *                 discount: 50
 *                 status: "ACTIVE"
 *                 plan:
 *                   name: "Premium Plan"
 *                   monthlyPrice: 1499
 *                   code: "PREM-300"
 *                   benefits: "High-speed internet with unlimited data, 24x7 support"
 *               latestInvoice:
 *                 id: 1
 *                 dueDate: "2025-09-01"
 *                 amountTotal: 1200
 *                 amountDue: 1200
 *                 taxAmount: 216
 *                 createdAt: "2025-08-01T10:00:00.000Z"
 *                 balance: 600
 *                 lastPayment:
 *                   id: 1
 *                   amount: 600
 *                   paymentMethod: "UPI"
 *                   date: "2025-08-15T14:30:00.000Z"
 *       404:
 *         description: Customer not found
 */
router.get("/:id", customerController.getCustomerById);

/**
 * @swagger
 * /customers/{id}:
 *   put:
 *     summary: Update customer by ID
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customer:
 *                 type: object
 *                 properties:
 *                   companyId:
 *                     type: integer
 *                   fullName:
 *                     type: string
 *                   billingName:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   phoneSecondary:
 *                     type: string
 *                   email:
 *                     type: string
 *                   address:
 *                     type: string
 *                   areaId:
 *                     type: integer
 *                   customerCode:
 *                     type: string
 *                   latitude:
 *                     type: string
 *                   longitude:
 *                     type: string
 *                   assignedAgentId:
 *                     type: integer
 *                   installationDate:
 *                     type: string
 *                     format: date
 *                   securityDeposit:
 *                     type: number
 *                   gstNumber:
 *                     type: string
 *                   advance:
 *                     type: integer
 *                   remarks:
 *                     type: string
 *                   createdBy:
 *                     type: integer
 *                   isActive:
 *                     type: boolean
 *               hardware:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     deviceType:
 *                       type: string
 *                     macAddress:
 *                       type: string
 *                     ipAddress:
 *                       type: string
 *               subscription:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     companyId:
 *                       type: integer
 *                     planId:
 *                       type: integer
 *                     startDate:
 *                       type: string
 *                       format: date
 *                     agreedMonthlyPrice:
 *                       type: number
 *                     billingType:
 *                       type: string
 *                       enum: [PREPAID, POSTPAID]
 *                     billingCycle:
 *                       type: string
 *                       enum: [MONTHLY, DAILY]
 *                     billingCycleValue:
 *                       type: integer
 *                     additionalCharge:
 *                       type: number
 *                     discount:
 *                       type: number
 *                     status:
 *                       type: string
 *                       enum: [ACTIVE, PAUSED, CANCELLED, CHANGED]
 *           example:
 *             customer:
 *               companyId: 1
 *               fullName: "John Doe Updated"
 *               billingName: "John D."
 *               phone: "9876543210"
 *               phoneSecondary: "9123456789"
 *               email: "john.doe.updated@example.com"
 *               address: "123 Main St, City"
 *               areaId: 2
 *               customerCode: "CUST123"
 *               latitude: "12.9716"
 *               longitude: "77.5946"
 *               assignedAgentId: 5
 *               installationDate: "2025-08-01"
 *               securityDeposit: 1000
 *               gstNumber: "29ABCDE1234F2Z5"
 *               advance: 500
 *               remarks: "VIP customer - Updated"
 *               createdBy: 1
 *               isActive: true
 *             hardware:
 *               - id: 1
 *                 deviceType: "Router"
 *                 macAddress: "00:1A:2B:3C:4D:5E"
 *                 ipAddress: "192.168.1.10"
 *             subscription:
 *               - id: 1
 *                 companyId: 1
 *                 planId: 3
 *                 startDate: "2025-08-01"
 *                 agreedMonthlyPrice: 1200
 *                 billingType: "POSTPAID"
 *                 billingCycle: "MONTHLY"
 *                 billingCycleValue: 1
 *                 additionalCharge: 100
 *                 discount: 50
 *                 status: "ACTIVE"
 *     responses:
 *       200:
 *         description: Customer updated
 *       404:
 *         description: Customer not found
 */
router.put("/:id", customerController.updateCustomer);

/**
 * @swagger
 * /customers/{id}:
 *   delete:
 *     summary: Delete customer by ID
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deleted
 *       404:
 *         description: Customer not found
 */
router.delete("/:id", customerController.deleteCustomer);

module.exports = router;
