const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB CONNECTED");
  } catch (e) {
    console.log("MongoDB connection failed", e.message);
    process.exit(1);
  }
};

module.exports = connectDb;
