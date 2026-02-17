/**
 * MongoDB connection via Mongoose.
 */

const mongoose = require('mongoose');

async function connectDB() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trackmint';

    try {
        await mongoose.connect(uri);
        console.log('✅ MongoDB connected');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    }

    mongoose.connection.on('error', (err) => {
        console.error('MongoDB runtime error:', err.message);
    });
}

async function disconnectDB() {
    await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
