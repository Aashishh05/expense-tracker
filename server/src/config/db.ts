import mongoose from 'mongoose';

/** Connect to MongoDB. Exits the process if the connection fails. */
async function connectDB(): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is missing in server/.env');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`MongoDB connection failed: ${message}`);
    process.exit(1);
  }
}

export default connectDB;
