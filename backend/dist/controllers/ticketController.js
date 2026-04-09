"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTickets = exports.createTicket = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Ticket_1 = __importDefault(require("../models/Ticket"));
const Company_1 = __importDefault(require("../models/Company"));
const ticketNumberGenerator_1 = require("../utils/ticketNumberGenerator");
// @desc Crear un nuevo ticket
// @route POST /api/tickets
exports.createTicket = (0, express_async_handler_1.default)(async (req, res) => {
    const { companyId, problemId, description } = req.body;
    const imagePath = req.file ? req.file.path : undefined;
    const company = await Company_1.default.findById(companyId);
    if (!company) {
        res.status(404).json({ message: 'Empresa no encontrada' });
        return;
    }
    const ticketNumber = await (0, ticketNumberGenerator_1.generateTicketNumber)(company);
    const cost = company.costPerTicket;
    const ticket = await Ticket_1.default.create({
        ticketNumber,
        companyId,
        problemId,
        description,
        imagePath,
        cost
    });
    res.status(201).json({ ticketNumber: ticket.ticketNumber, ticket });
});
// @desc Obtener tickets con filtros (admin)
// @route GET /api/tickets
exports.getTickets = (0, express_async_handler_1.default)(async (req, res) => {
    const { companyId, startDate, endDate } = req.query;
    let filter = {};
    if (companyId)
        filter.companyId = companyId;
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate)
            filter.createdAt.$gte = new Date(startDate);
        if (endDate)
            filter.createdAt.$lte = new Date(endDate);
    }
    const tickets = await Ticket_1.default.find(filter)
        .populate('companyId', 'name code')
        .populate('problemId', 'title')
        .sort({ createdAt: -1 });
    res.json(tickets);
});
