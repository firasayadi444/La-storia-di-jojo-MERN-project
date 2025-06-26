const mongoose = require("mongoose");

const connectDatabase = () => {
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  };

  mongoose
    .connect(process.env.DB, options)
    .then(() => {
      console.log("Database is successfully connected");
    })
    .catch((err) => {
      console.log("Database connection error:", err.message);
      console.log("Please make sure MongoDB is running or check your connection string");
      // Don't exit the process, let it continue but log the error
    });
};

module.exports = connectDatabase;
