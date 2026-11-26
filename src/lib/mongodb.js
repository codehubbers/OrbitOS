import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }

  if (!cached.promise) {
    // Fail fast when the database is unreachable (mongoose waits ~30s by
    // default), so the API can answer 503 quickly.
    cached.promise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Don't cache a failed connection: the next request should try again
    // instead of failing until the server restarts.
    cached.promise = null;
    throw error;
  }
  return cached.conn;
}

export default dbConnect;
