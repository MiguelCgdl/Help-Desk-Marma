import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Ticket from '../models/Ticket';
import Company from '../models/Company';

// @desc Resumen por empresa y mes
// @route GET /api/reports/summary
export const getMonthlySummary = asyncHandler(async (req, res) => {
    const { year, month } = req.query;
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

    const tickets = await Ticket.find({
        createdAt: { $gte: startDate, $lte: endDate }
    }).populate('companyId');

    const summaryByCompany: any = {};
    tickets.forEach(ticket => {
        const companyName = (ticket.companyId as any).name;
        if (!summaryByCompany[companyName]) {
            summaryByCompany[companyName] = { count: 0, totalCost: 0 };
        }
        summaryByCompany[companyName].count++;
        summaryByCompany[companyName].totalCost += ticket.cost;
    });

    res.json({ summaryByCompany, totalTickets: tickets.length, totalAmount: tickets.reduce((sum, t) => sum + t.cost, 0) });
});