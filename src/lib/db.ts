import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

declare global {
  var _mongooseConn: Promise<typeof mongoose> | undefined;
}

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    console.log("Already connected to:", mongoose.connection.name);
    return mongoose;
  }

  if (mongoose.connection.readyState === 2 && global._mongooseConn) {
    return global._mongooseConn;
  }

  if (!global._mongooseConn) {
    const dbName = process.env.MONGODB_DB || "webcrest_hr";

    console.log(`Connecting to MongoDB database: ${dbName}`);

    global._mongooseConn = mongoose
      .connect(MONGODB_URI, {
        dbName: dbName,
        retryWrites: true,
        w: "majority",
      })
      .then((m) => {
        console.log(`✅ Mongo connected to "${m.connection.name}"`);
        console.log(`✅ Connection state: ${m.connection.readyState}`);
        return m;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection failed:", error);
        global._mongooseConn = undefined;
        throw error;
      });
  }

  return global._mongooseConn;
}
