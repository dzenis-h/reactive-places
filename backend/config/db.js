const mongoose = require("mongoose");

const MONGO_URI = require("./config_prod").MONGO_URI;

const connectDB = async () => {
  const conn = await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  });
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};

exports.connectDB = connectDB;
