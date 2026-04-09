import mongoose from 'mongoose';
import User from './src/models/User';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const check = async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/marmacore');
    const users = await User.find({});
    console.log('Usuarios en DB:', users.map(u => ({ username: u.username })));
    process.exit(0);
};

check();
