import mongoose from 'mongoose';
import { config } from './env.js';

mongoose.set('strictQuery', true);

export async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[db] connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.error('[db] connection error:', err.message);
    throw err;
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] disconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[db] error:', err.message);
  });
}
