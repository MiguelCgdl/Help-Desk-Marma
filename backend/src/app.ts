import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import companyRoutes from './routes/companyRoutes';
import problemRoutes from './routes/problemRoutes';
import ticketRoutes from './routes/ticketRoutes';
import reportRoutes from './routes/reportRoutes';
import billingRoutes from './routes/billingRoutes';
import path from 'path';
import { createAdmin } from './controllers/authController';
import mongoose from 'mongoose';

const start = async () => {
    // Cargar .env aunque el proceso se ejecute desde otra carpeta
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
    mongoose.set('bufferCommands', false);
    const dbConnected = await connectDB();
    if (dbConnected) {
        await createAdmin();
    } else {
        console.warn('Saltando createAdmin porque MongoDB no está disponible.');
    }

    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    app.use('/api/auth', authRoutes);
    app.use('/api/companies', companyRoutes);
    app.use('/api/problems', problemRoutes);
    app.use('/api/tickets', ticketRoutes);
    app.use('/api/reports', reportRoutes);
    app.use('/api/billing', billingRoutes);
    
    // Error handler
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
        console.error(err);
        res.status(err.status || 500).json({ 
            message: err.message || 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? err : {}
        });
    });

    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start();