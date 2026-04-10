import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Company from '../models/Company';

export const getCompanies = asyncHandler(async (req, res) => {
    const companies = await Company.find().select('-password');
    res.json(companies);
});

export const getCompanyLogo = asyncHandler(async (req, res) => {
    const { username } = req.query;
    if (!username) { res.json({ name: '', logoUrl: '' }); return; }
    const company = await Company.findOne({ loginUsername: username }).select('name logoUrl');
    if (!company) { res.json({ name: '', logoUrl: '' }); return; }
    res.json({ name: company.name, logoUrl: company.logoUrl });
});

export const createCompany = asyncHandler(async (req, res) => {
    const { name, code, costPerTicket, email, loginUsername, password, rfc } = req.body;
    let logoUrl = req.body.logoUrl;
    if (req.file) {
        logoUrl = `uploads/${req.file.filename}`;
    }
    
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
        logoUrl,
        rfc
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
    const { name, code, costPerTicket, email, loginUsername, password, rfc } = req.body;
    let logoUrl = req.body.logoUrl;
    if (req.file) {
        logoUrl = `uploads/${req.file.filename}`;
    }
    if (name !== undefined) company.name = name;
    if (code !== undefined) company.code = code;
    if (costPerTicket !== undefined) company.costPerTicket = costPerTicket;
    if (email !== undefined) company.email = email;
    if (loginUsername !== undefined) company.loginUsername = loginUsername;
    if (logoUrl !== undefined) company.logoUrl = logoUrl;
    if (rfc !== undefined) company.rfc = rfc;
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