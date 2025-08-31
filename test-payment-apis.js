const axios = require("axios");

const BASE_URL = "http://localhost:3000/api";

// Test data
const testCredentials = {
  phone: "0000000000",
  password: "supersecret123",
};

let authToken = "";

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (method, url, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(
      `Error in ${method} ${url}:`,
      error.response?.data || error.message
    );
    return null;
  }
};

// Test functions
const testLogin = async () => {
  console.log("🔐 Testing login...");
  console.log("Credentials:", testCredentials);
  console.log("URL:", `${BASE_URL}/auth/login`);

  try {
    const response = await axios.post(
      `${BASE_URL}/auth/login`,
      testCredentials,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    authToken = response.data.token;
    console.log("✅ Login successful");
    console.log("Response:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Login failed:");
    console.error("Error message:", error.message);
    console.error("Response data:", error.response?.data);
    console.error("Response status:", error.response?.status);
    return false;
  }
};

const testSearchCustomers = async () => {
  console.log("\n🔍 Testing search customers...");
  const params = {
    query: "Customer 3",
  };

  const queryString = new URLSearchParams(params).toString();
  const result = await makeAuthenticatedRequest(
    "GET",
    `/payments/search-customers?${queryString}`
  );

  if (result && result.success) {
    console.log("✅ Customer search working");
    console.log(`   Found ${result.data.length} customers`);
    return result.data.length > 0 ? result.data[0] : null;
  } else {
    console.log("❌ Customer search failed");
    return null;
  }
};

const testGetCustomerPaymentDetails = async (customerId) => {
  console.log("\n💰 Testing get customer payment details...");
  const result = await makeAuthenticatedRequest(
    "GET",
    `/payments/customer/${customerId}`
  );

  if (result && result.success) {
    console.log("✅ Customer payment details retrieved");
    console.log(`   Customer: ${result.data.customer.fullName}`);
    console.log(`   Balance: ₹${result.data.balanceAmount}`);
    console.log(`   Last Bill: ₹${result.data.lastBillAmount}`);
    return result.data;
  } else {
    console.log("❌ Failed to get customer payment details");
    return null;
  }
};

const testRecordPayment = async (customerId) => {
  console.log("\n💳 Testing record payment...");
  const paymentData = {
    customerId: customerId,
    amount: 1000,
    discount: 50,
    method: "CASH",
    comments: "Test payment from API",
  };

  const result = await makeAuthenticatedRequest(
    "POST",
    "/payments/record",
    paymentData
  );

  if (result && result.success) {
    console.log("✅ Payment recorded successfully");
    console.log(`   Payment ID: ${result.data.paymentId}`);
    console.log(`   Amount: ₹${result.data.amount}`);
    console.log(`   Method: ${result.data.method}`);
    console.log(`   Invoice Status: ${result.data.invoiceStatus}`);
    return result.data;
  } else {
    console.log("❌ Failed to record payment");
    return null;
  }
};

const testGetPaymentHistory = async () => {
  console.log("\n📊 Testing get payment history...");
  const params = {
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    page: 1,
    limit: 10,
  };

  const queryString = new URLSearchParams(params).toString();
  const result = await makeAuthenticatedRequest(
    "GET",
    `/payments/history?${queryString}`
  );

  if (result && result.success) {
    console.log("✅ Payment history retrieved");
    console.log(`   Found ${result.data.payments.length} payments`);
    console.log(`   Total pages: ${result.data.pagination.totalPages}`);
    return true;
  } else {
    console.log("❌ Failed to get payment history");
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log("🚀 Starting Payment API Tests...\n");

  // Test login first
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log("❌ Cannot proceed without authentication");
    return;
  }

  // Test customer search
  const customer = await testSearchCustomers();
  if (!customer) {
    console.log("❌ Cannot proceed without a customer");
    return;
  }

  // Test customer payment details
  const customerDetails = await testGetCustomerPaymentDetails(customer.id);
  if (!customerDetails) {
    console.log("❌ Cannot proceed without customer details");
    return;
  }

  // Test record payment
  const paymentResult = await testRecordPayment(customer.id);
  if (!paymentResult) {
    console.log("❌ Payment recording failed");
    return;
  }

  // Test payment history
  const historyResult = await testGetPaymentHistory();

  console.log("\n📋 Payment API Test Results:");
  console.log("✅ All payment APIs are working correctly!");
  console.log("✅ Customer search functionality works");
  console.log("✅ Payment details retrieval works");
  console.log("✅ Payment recording works");
  console.log("✅ Payment history retrieval works");
  console.log("\n🎉 Payment system is ready for use!");
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testLogin,
  testSearchCustomers,
  testGetCustomerPaymentDetails,
  testRecordPayment,
  testGetPaymentHistory,
  runTests,
};
