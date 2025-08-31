const sequelize = require("./app/config/db");
const User = require("./app/models/User");
const bcrypt = require("bcrypt");

const testLogin = async () => {
  try {
    // Find user
    const user = await User.findOne({
      where: { phone: "0000000000" },
      attributes: { include: ["passwordHash"] },
    });

    if (!user) {
      console.log("User not found");
      return;
    }

    console.log("User found:", user.name);
    console.log("Password hash:", user.passwordHash);

    // Test password comparison
    const password = "supersecret123";
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    console.log("Password match:", isMatch);

    // Test with wrong password
    const wrongPassword = "wrongpassword";
    const isWrongMatch = await bcrypt.compare(wrongPassword, user.passwordHash);

    console.log("Wrong password match:", isWrongMatch);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await sequelize.close();
  }
};

testLogin();
