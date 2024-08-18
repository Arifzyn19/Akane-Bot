import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";

const connectToMongoDb = () => {
  try {
    mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const mongo = mongoose.connection;
    mongo.on("error", console.error.bind(console, "Connection error:"));
    mongo.once("open", () => {
      console.log("</> Success connect to MongoDb 🚀");
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

/*
 * shema buat sendiri aj
 */

export { connectToMongoDb };
