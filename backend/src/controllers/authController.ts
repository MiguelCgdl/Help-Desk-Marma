import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/User';
import Company from '../models/Company';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export const login = asyncHandler(async (req: Request, res: Response, next) => {
    const { username, password } = req.body;
    console.log(`Intento de login para usuario: ${username}`);

    // Fallback cuando MongoDB no está disponible (modo degradado).
    // Esto permite seguir usando el panel admin en entornos locales sin DB.
    if (mongoose.connection.readyState !== 1 && process.env.ALLOW_FALLBACK_LOGIN === 'true') {
        const adminUser = process.env.ADMIN_USERNAME || 'Marmacore';
        const adminPass = process.env.ADMIN_PASSWORD || 'Qd3d10x2026';

        const ok = username === adminUser && password === adminPass;
        console.log(`Login fallback (sin DB). ¿Credenciales OK?: ${ok}`);

        if (!ok) {
            res.status(401).json({ message: 'Credenciales incorrectas' });
            return;
        }

        const token = jwt.sign(
            { id: 'local-admin', username: adminUser },
            process.env.JWT_SECRET as string,
            { expiresIn: '30d' }
        );
        res.json({ token, username: adminUser });
        return;
    }

    if (mongoose.connection.readyState !== 1) {
        res.status(503).json({ message: 'Base de datos no disponible. Intenta de nuevo en unos segundos.' });
        return;
    }
    
    const user = await User.findOne({ username });
    if (!user) {
        console.log(`Usuario no encontrado: ${username}`);
        res.status(401).json({ message: 'Usuario no encontrado' });
        return;
    }

    const isMatch = await user.matchPassword(password);
    console.log(`¿Password coincide?: ${isMatch}`);

    if (isMatch) {
        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET as string, { expiresIn: '30d' });
        res.json({ token, username: user.username });
    } else {
        res.status(401).json({ message: 'Contraseña incorrecta' });
    }
});

// @desc Login portal empresa (usuario/contraseña definidos en alta de empresa)
// @route POST /api/auth/company-login
export const companyLogin = asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body as { username?: string; password?: string };
    if (!username || !password) {
        res.status(400).json({ message: 'Usuario y contraseña requeridos' });
        return;
    }

    const company = await Company.findOne({ loginUsername: username.trim() }).select('+password');
    if (!company) {
        res.status(401).json({ message: 'Credenciales incorrectas' });
        return;
    }

    const ok = await company.matchPassword(password);
    if (!ok) {
        res.status(401).json({ message: 'Credenciales incorrectas' });
        return;
    }

    const token = jwt.sign(
        {
            role: 'company',
            companyId: String(company._id),
            companyName: company.name,
            code: company.code
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '30d' }
    );

    res.json({
        token,
        company: {
            _id: company._id,
            name: company.name,
            code: company.code,
            email: company.email,
            logoUrl: company.logoUrl
        }
    });
});

// Script para crear admin por primera vez
export const createAdmin = async () => {
    try {
        const username = process.env.ADMIN_USERNAME || 'Marmacore';
        const password = process.env.ADMIN_PASSWORD || 'Qd3d10x2026';
        
        console.log('Verificando existencia de admin...');
        const user = await User.findOne({ username });
        
        if (user) {
            user.password = password;
            await user.save();
            console.log('✅ Admin existente actualizado correctamente.');
        } else {
            await User.create({ username, password });
            console.log('✅ Nuevo admin creado correctamente.');
        }
    } catch (err) {
        console.error('❌ Error crítico al gestionar admin:', err);
    }
};