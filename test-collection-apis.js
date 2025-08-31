const axios = require("axios");

const BASE_URL = "http://localhost:3000/api";

// Test data
const testCredentials = {
  phone: "1111111111",
  password: "adminpass123",
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
  try {
    const response = await axios.post(
      `${BASE_URL}/auth/login`,
      testCredentials
    );
    authToken = response.data.token;
    console.log("✅ Login successful");
    return true;
  } catch (error) {
    console.error("❌ Login failed:", error.response?.data || error.message);
    return false;
  }
};

const testGetAreas = async () => {
  console.log("\n📍 Testing get areas...");
  const result = await makeAuthenticatedRequest("GET", "/collection/areas");
  if (result && result.success) {
    console.log("✅ Areas retrieved successfully");
    console.log(`   Found ${result.data.length} areas`);
    return true;
  } else {
    console.log("❌ Failed to get areas");
    return false;
  }
};

const testGetCollectionSummary = async () => {
  console.log("\n📊 Testing get collection summary...");
  const params = {
    startDate: "2025-08-01",
    endDate: "2025-08-31",
  };

  const queryString = new URLSearchParams(params).toString();
  const result = await makeAuthenticatedRequest(
    "GET",
    `/collection/summary?${queryString}`
  );

  if (result && result.success) {
    console.log("✅ Collection summary retrieved successfully");
    console.log(`   Total Paid: ₹${result.data.totalPaid}`);
    console.log(`   Total Customers: ${result.data.totalCustomers}`);
    console.log(`   Balance to Collect: ₹${result.data.totalBalanceToCollect}`);
    return true;
  } else {
    console.log("❌ Failed to get collection summary");
    return false;
  }
};

const testGetCollectionData = async () => {
  console.log("\n📈 Testing get collection data...");
  const params = {
    startDate: "2025-08-01",
    endDate: "2025-08-31",
  };

  const queryString = new URLSearchParams(params).toString();
  const result = await makeAuthenticatedRequest(
    "GET",
    `/collection/data?${queryString}`
  );

  if (result && result.success) {
    console.log("✅ Collection data retrieved successfully");
    console.log(`   Found ${result.data.length} days with collection data`);

    if (result.data.length > 0) {
      const firstDay = result.data[0];
      console.log(
        `   First day: ${firstDay.date} with ${firstDay.totalCustomers} customers`
      );
      console.log(`   Total payment: ₹${firstDay.totalPayment}`);
    }
    return true;
  } else {
    console.log("❌ Failed to get collection data");
    return false;
  }
};

const testGetCollectionDataJuly = async () => {
  console.log("\n📈 Testing get collection data for July...");
  const params = {
    startDate: "2025-07-01",
    endDate: "2025-07-31",
  };

  const queryString = new URLSearchParams(params).toString();
  const result = await makeAuthenticatedRequest(
    "GET",
    `/collection/data?${queryString}`
  );

  if (result && result.success) {
    console.log("✅ July collection data retrieved successfully");
    console.log(`   Found ${result.data.length} days with collection data`);

    if (result.data.length > 0) {
      const firstDay = result.data[0];
      console.log(
        `   First day: ${firstDay.date} with ${firstDay.totalCustomers} customers`
      );
      console.log(`   Total payment: ₹${firstDay.totalPayment}`);
    }
    return true;
  } else {
    console.log("❌ Failed to get July collection data");
    return false;
  }
};

const testGetCollectionDataJune = async () => {
  console.log("\n📈 Testing get collection data for June...");
  const params = {
    startDate: "2025-06-01",
    endDate: "2025-06-30",
  };

  const queryString = new URLSearchParams(params).toString();
  const result = await makeAuthenticatedRequest(
    "GET",
    `/collection/data?${queryString}`
  );

  if (result && result.success) {
    console.log("✅ June collection data retrieved successfully");
    console.log(`   Found ${result.data.length} days with collection data`);

    if (result.data.length > 0) {
      const firstDay = result.data[0];
      console.log(
        `   First day: ${firstDay.date} with ${firstDay.totalCustomers} customers`
      );
      console.log(`   Total payment: ₹${firstDay.totalPayment}`);
    }
    return true;
  } else {
    console.log("❌ Failed to get June collection data");
    return false;
  }
};

const testFilterByPaymentMethod = async () => {
  console.log("\n💳 Testing filter by payment method...");
  const params = {
    startDate: "2025-08-01",
    endDate: "2025-08-31",
    paymentMethod: "UPI",
  };

  const queryString = new URLSearchParams(params).toString();
  const result = await makeAuthenticatedRequest(
    "GET",
    `/collection/data?${queryString}`
  );

  if (result && result.success) {
    console.log("✅ Payment method filter working");
    console.log(`   Found ${result.data.length} days with UPI payments`);
    return true;
  } else {
    console.log("❌ Payment method filter failed");
    return false;
  }
};

const testFilterByArea = async () => {
  console.log("\n📍 Testing filter by area...");

  // First get areas to get a valid area ID
  const areasResult = await makeAuthenticatedRequest(
    "GET",
    "/collection/areas"
  );
  if (!areasResult || !areasResult.success || areasResult.data.length === 0) {
    console.log("❌ No areas available for testing");
    return false;
  }

  const areaId = areasResult.data[0].id; // Use first area
  const params = {
    startDate: "2025-08-01",
    endDate: "2025-08-31",
    areaId: areaId,
  };

  const queryString = new URLSearchParams(params).toString();
  const result = await makeAuthenticatedRequest(
    "GET",
    `/collection/data?${queryString}`
  );

  if (result && result.success) {
    console.log("✅ Area filter working");
    console.log(
      `   Found ${result.data.length} days with collections in area ${areaId}`
    );
    return true;
  } else {
    console.log("❌ Area filter failed");
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log("🚀 Starting Collection API Tests...\n");

  const tests = [
    testLogin,
    testGetAreas,
    testGetCollectionSummary,
    testGetCollectionData,
    testGetCollectionDataJuly,
    testGetCollectionDataJune,
    testFilterByPaymentMethod,
    testFilterByArea,
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    const result = await test();
    if (result) passedTests++;
  }

  console.log("\n📋 Test Results:");
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(
    `   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`
  );

  if (passedTests === totalTests) {
    console.log(
      "\n🎉 All tests passed! Collection APIs are working correctly."
    );
  } else {
    console.log("\n⚠️  Some tests failed. Please check the implementation.");
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testLogin,
  testGetAreas,
  testGetCollectionSummary,
  testGetCollectionData,
  testGetCollectionDataJuly,
  testGetCollectionDataJune,
  testFilterByPaymentMethod,
  testFilterByArea,
  runTests,
};
