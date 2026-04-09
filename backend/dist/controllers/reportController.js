"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthlySummary = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Ticket_1 = __importDefault(require("../models/Ticket"));
// @desc Resumen por empresa y mes
// @route GET /api/reports/summary
exports.getMonthlySummary = (0, express_async_handler_1.default)(async (req, res) => {
    const { year, month } = req.query;
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
    const tickets = await Ticket_1.default.find({
        createdAt: { $gte: startDate, $lte: endDate }
    }).populate('companyId');
    const summaryByCompany = {};
    tickets.forEach(ticket => {
        const companyName = ticket.companyId.name;
        if (!summaryByCompany[companyName]) {
            summaryByCompany[companyName] = { count: 0, totalCost: 0 };
        }
        summaryByCompany[companyName].count++;
        summaryByCompany[companyName].totalCost += ticket.cost;
    });
    res.json({ summaryByCompany, totalTickets: tickets.length, totalAmount: tickets.reduce((sum, t) => sum + t.cost, 0) });
});
