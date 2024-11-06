const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (e) {
    console.log("MongoDB connection failed");
    process.exit(1);
  }
};

module.exports = connectDb;
