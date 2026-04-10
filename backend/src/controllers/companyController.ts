import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Company from '../models/Company';

export const getCompanies = asyncHandler(async (req, res) => {
    const companies = await Company.find().select('-password');
    res.json(companies);
});

export const createCompany = asyncHandler(async (req, res) => {
    const { name, code, costPerTicket, email, loginUsername, password, logoUrl } = req.body;
    if (!email || !loginUsername || !password) {
        res.status(400).json({ message: 'Email, usuario de acceso y contraseña son obligatorios' });
        return;
    }
    const company = await Company.create({
        name,
        code,
        costPerTicket,
        email,
        loginUsername,
        password,
        logoUrl
    });
    const created = company.toObject();
    delete (created as any).password;
    res.status(201).json(created);
});

export const updateCompany = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.params.id).select('+password');
    if (!company) {
        res.status(404).json({ message: 'Empresa no encontrada' });
        return;
    }
    const { name, code, costPerTicket, email, loginUsername, password, logoUrl } = req.body;
    if (name !== undefined) company.name = name;
    if (code !== undefined) company.code = code;
    if (costPerTicket !== undefined) company.costPerTicket = costPerTicket;
    if (email !== undefined) company.email = email;
    if (loginUsername !== undefined) company.loginUsername = loginUsername;
    if (logoUrl !== undefined) company.logoUrl = logoUrl;
    if (password && String(password).trim() !== '') {
        company.password = password;
    }
    await company.save();
    const out = company.toObject();
    delete (out as any).password;
    res.json(out);
});

export const deleteCompany = asyncHandler(async (req, res) => {
    await Company.findByIdAndDelete(req.params.id);
    res.json({ message: 'Eliminada' });
});