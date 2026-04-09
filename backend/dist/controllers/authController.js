"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdmin = exports.login = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const User_1 = __importDefault(require("../models/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.login = (0, express_async_handler_1.default)(async (req, res) => {
    const { email, password } = req.body;
    const user = await User_1.default.findOne({ email });
    if (user && (await user.matchPassword(password))) {
        const token = jsonwebtoken_1.default.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, email: user.email });
    }
    else {
        res.status(401).json({ message: 'Credenciales incorrectas' });
    }
});
// Script para crear admin por primera vez (ejecutar manualmente)
const createAdmin = async () => {
    const exists = await User_1.default.findOne({ email: 'admin@marmacore.com' });
    if (!exists) {
        await User_1.default.create({ email: 'admin@marmacore.com', password: 'Admin123!' });
        console.log('Admin creado: admin@marmacore.com / Admin123!');
    }
};
exports.createAdmin = createAdmin;
