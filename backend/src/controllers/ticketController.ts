import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Ticket from '../models/Ticket';
import Company from '../models/Company';
import { generateTicketNumber } from '../utils/ticketNumberGenerator';
import Problem from '../models/Problem';

// @desc Crear un nuevo ticket
// @route POST /api/tickets
export const createTicket = asyncHandler(async (req, res) => {
    const { companyId: bodyCompanyId, problemId, description } = req.body;
    const imagePath = req.file ? req.file.path : undefined;

    const tokenCompanyId = (req as any).companyIdFromToken as string | undefined;
    if (tokenCompanyId && bodyCompanyId && String(bodyCompanyId) !== String(tokenCompanyId)) {
        res.status(403).json({ message: 'No puedes crear tickets para otra empresa' });
        return;
    }
    const companyId = tokenCompanyId || bodyCompanyId;

    if (!companyId) {
        res.status(400).json({ message: 'Empresa requerida' });
        return;
    }

    const company = await Company.findById(companyId);
    if (!company) {
        res.status(404).json({ message: 'Empresa no encontrada' });
        return;
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
        res.status(404).json({ message: 'Tipo de problema no encontrado' });
        return;
    }

    const ticketNumber = await generateTicketNumber(company);
    // El costo se calcula al marcar como "solucionado" (costo/hora * tiempo invertido)
    const cost = 0;

    const ticket = await Ticket.create({
        ticketNumber,
        companyId,
        problemId,
        description,
        imagePath,
        cost,
        costPerHourSnapshot: problem.costPerHour
    });

    res.status(201).json({ ticketNumber: ticket.ticketNumber, ticket });
});

// @desc Obtener tickets con filtros (admin)
// @route GET /api/tickets
export const getTickets = asyncHandler(async (req, res) => {
    const { companyId, startDate, endDate } = req.query;
    let filter: any = {};
    if (companyId) filter.companyId = companyId;
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }
    const tickets = await Ticket.find(filter)
        .populate('companyId', 'name code')
        .populate('problemId', 'title costPerHour')
        .sort({ createdAt: -1 });
    res.json(tickets);
});

// @desc Tickets de la empresa autenticada (portal empresa)
// @route GET /api/tickets/company/my
export const getCompanyTickets = asyncHandler(async (req, res) => {
    const companyId = (req as any).companyId as string;
    const tickets = await Ticket.find({ companyId })
        .populate('problemId', 'title costPerHour')
        .sort({ createdAt: -1 });
    res.json(tickets);
});

// @desc Marcar ticket como solucionado y registrar tiempo invertido
// @route PATCH /api/tickets/:id/solve
export const solveTicket = asyncHandler(async (req: Request, res: Response) => {
    const { minutesSpent } = req.body as { minutesSpent: number };
    const parsedMinutes = Number(minutesSpent);
    if (!Number.isFinite(parsedMinutes) || parsedMinutes < 0) {
        res.status(400).json({ message: 'minutesSpent inválido' });
        return;
    }

    const ticket = await Ticket.findById(req.params.id).populate('problemId', 'costPerHour');
    if (!ticket) {
        res.status(404).json({ message: 'Ticket no encontrado' });
        return;
    }

    const costPerHour =
        typeof ticket.costPerHourSnapshot === 'number'
            ? ticket.costPerHourSnapshot
            : Number((ticket.problemId as any)?.costPerHour || 0);

    const hours = parsedMinutes / 60;
    const computedCost = Math.round(costPerHour * hours * 100) / 100;

    ticket.status = 'solved';
    ticket.solvedAt = new Date();
    ticket.timeSpentMinutes = parsedMinutes;
    ticket.costPerHourSnapshot = costPerHour;
    ticket.cost = computedCost;
    await ticket.save();

    res.json(ticket);
});