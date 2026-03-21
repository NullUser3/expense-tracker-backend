import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.DB_URI;
  if (!uri) throw new Error('Missing DB_URI in environment variables');

  try {
    await mongoose.connect(uri); 
    console.log('MongoDB connected via Mongoose');
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    process.exit(1); 
  }
};

export default connectDB;