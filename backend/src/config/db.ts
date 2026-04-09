import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Cargar .env aunque el proceso se ejecute desde otra carpeta
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.warn('MONGO_URI no está configurado; iniciando sin MongoDB.');
            return false;
        }

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 2000,
            connectTimeoutMS: 2000,
            ...(process.env.MONGO_USER && process.env.MONGO_PASS
                ? { user: process.env.MONGO_USER, pass: process.env.MONGO_PASS }
                : {})
        });
        console.log('MongoDB connected');
        return true;
    } catch (error) {
        console.error('No se pudo conectar a MongoDB. El servidor iniciará en modo degradado.', error);
        return false;
    }
};

export default connectDB;