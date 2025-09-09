const mongoose = require('mongoose');

let isConnected = false;

async function connectToDatabase() {
  if (isConnected) return mongoose.connection;

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/job_portal';

  mongoose.set('strictQuery', true);

  await mongoose.connect(mongoUri, { autoIndex: true });

  isConnected = true;

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
  });
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
    isConnected = false;
  });

  return mongoose.connection;
}

module.exports = { connectToDatabase };