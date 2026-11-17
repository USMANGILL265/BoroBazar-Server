import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let cached = global.mongooseCache;
if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

async function connectDb() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Please provide MONGODB_URI in environment variables");
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, { bufferCommands: false })
      .then((m) => {
        console.log("Connect DB");
        return m;
      })
      .catch((error) => {
        cached.promise = null; // agli request par dobara try ho
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDb;