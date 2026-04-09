"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCompany = exports.updateCompany = exports.createCompany = exports.getCompanies = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Company_1 = __importDefault(require("../models/Company"));
exports.getCompanies = (0, express_async_handler_1.default)(async (req, res) => {
    const companies = await Company_1.default.find();
    res.json(companies);
});
exports.createCompany = (0, express_async_handler_1.default)(async (req, res) => {
    const company = await Company_1.default.create(req.body);
    res.status(201).json(company);
});
exports.updateCompany = (0, express_async_handler_1.default)(async (req, res) => {
    const company = await Company_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(company);
});
exports.deleteCompany = (0, express_async_handler_1.default)(async (req, res) => {
    await Company_1.default.findByIdAndDelete(req.params.id);
    res.json({ message: 'Eliminada' });
});
