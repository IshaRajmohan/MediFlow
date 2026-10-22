const mongoose = require('mongoose');

const connectDB = async () => {
  // Scenario: Missing connection string
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined in the environment variables');
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    // Scenario: Valid connection string
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    // Scenario: Incorrect password or Network access issues
    // We throw the error so it propagates up to server.js
    throw error;
  }
};

module.exports = connectDB;
