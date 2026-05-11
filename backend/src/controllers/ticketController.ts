import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Ticket from '../models/Ticket';
import Company from '../models/Company';
import Problem from '../models/Problem';
import { generateTicketNumber } from '../utils/ticketNumberGenerator';
import { sendTicketResolutionEmail, sendNewTicketEmail } from '../utils/mailer';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tickets
// Body: { companyId, problems: [{problemId, title?}], description }
// problems[].problemId can be null/empty for "Otros"
// ─────────────────────────────────────────────────────────────────────────────
export const createTicket = asyncHandler(async (req, res) => {
    const { companyId: bodyCompanyId, problems: rawProblems, description } = req.body;
    const imagePath = req.file ? req.file.path : undefined;

    const tokenCompanyId = (req as any).companyIdFromToken as string | undefined;
    if (tokenCompanyId && bodyCompanyId && String(bodyCompanyId) !== String(tokenCompanyId)) {
        res.status(403).json({ message: 'No puedes crear tickets para otra empresa' });
        return;
    }
    const companyId = tokenCompanyId || bodyCompanyId;

    if (!companyId) { res.status(400).json({ message: 'Empresa requerida' }); return; }

    const company = await Company.findById(companyId);
    if (!company) { res.status(404).json({ message: 'Empresa no encontrada' }); return; }

    // Parse problems — may come as JSON string (multipart) or array (JSON body)
    let problemsInput: Array<{ problemId?: string | null; title?: string }> = [];
    if (typeof rawProblems === 'string') {
        try { problemsInput = JSON.parse(rawProblems); } catch { problemsInput = []; }
    } else if (Array.isArray(rawProblems)) {
        problemsInput = rawProblems;
    }

    if (problemsInput.length === 0) {
        res.status(400).json({ message: 'Debes seleccionar al menos un problema' });
        return;
    }

    // Build problem entries (snapshot title & costPerHour at ticket creation)
    const problemEntries = await Promise.all(
        problemsInput.map(async (p) => {
            if (p.problemId) {
                const doc = await Problem.findById(p.problemId);
                return {
                    problemId: p.problemId,
                    title: doc?.title ?? 'Desconocido',
                    costPerHour: doc?.costPerHour ?? 0,
                    timeSpentMinutes: 0,
                    cost: 0,
                    manualCost: false
                };
            } else {
                // "Otros" — no problem doc
                return {
                    problemId: null,
                    title: p.title || 'Otros / Sin categoría',
                    costPerHour: 0,
                    timeSpentMinutes: 0,
                    cost: 0,
                    manualCost: false
                };
            }
        })
    );

    const ticketNumber = await generateTicketNumber(company);

    const ticket = await Ticket.create({
        ticketNumber,
        companyId,
        problems: problemEntries,
        description,
        imagePath,
        cost: 0
    });

    res.status(201).json({ ticketNumber: ticket.ticketNumber, ticket });
    
    // Send email notification to company
    if (company && company.email) {
        sendNewTicketEmail(company.email, ticket.ticketNumber, company.name, description || 'Sin descripción').catch(console.error);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tickets   (admin)
// ─────────────────────────────────────────────────────────────────────────────
export const getTickets = asyncHandler(async (req, res) => {
    const { companyId, status, requiresInvoice, startDate, endDate } = req.query;
    const filter: Record<string, any> = {};
    if (companyId) filter.companyId = companyId;
    if (status)    filter.status    = status;
    if (requiresInvoice !== undefined && requiresInvoice !== '') {
        filter.requiresInvoice = requiresInvoice === 'true';
    }
    const showArchived = req.query.showArchived === 'true';
    if (!showArchived) {
        filter.archived = { $ne: true };
    }
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        if (endDate)   filter.createdAt.$lte = new Date(endDate as string);
    }
    const tickets = await Ticket.find(filter)
        .populate('companyId', 'name code logoUrl rfc')
        .populate('problems.problemId', 'title costPerHour')
        .sort({ createdAt: -1 });
    res.json(tickets);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tickets/company/my   (empresa autenticada)
// ─────────────────────────────────────────────────────────────────────────────
export const getCompanyTickets = asyncHandler(async (req, res) => {
    const companyId = (req as any).companyId as string;
    const tickets = await Ticket.find({ companyId })
        .populate('problems.problemId', 'title')
        .sort({ createdAt: -1 });
    res.json(tickets);
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tickets/:id/solve   (admin)
// Body: { problemResolutions: [{index, timeSpentMinutes, manualCost?, cost?}] }
// Calculates cost per problem: costPerHour * (minutes/60), or uses manual cost
// ─────────────────────────────────────────────────────────────────────────────
export const solveTicket = asyncHandler(async (req: Request, res: Response) => {
    const { problemResolutions, comments } = req.body as {
        problemResolutions: Array<{
            index: number;
            timeSpentMinutes: number;
            manualCost?: boolean;
            cost?: number;
        }>;
        comments?: string;
    };

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) { res.status(404).json({ message: 'Ticket no encontrado' }); return; }
    if (ticket.invoiced) {
        res.status(400).json({ message: 'No se puede editar un ticket que ya ha sido facturado' });
        return;
    }

    // Apply resolutions to each problem entry
    for (const r of problemResolutions) {
        const entry = ticket.problems[r.index];
        if (!entry) continue;
        entry.timeSpentMinutes = Math.max(0, Number(r.timeSpentMinutes) || 0);

        if (r.manualCost && typeof r.cost === 'number') {
            entry.cost = Math.round(r.cost * 100) / 100;
            entry.manualCost = true;
        } else {
            entry.cost = Math.round(entry.costPerHour * 100) / 100;
            entry.manualCost = false;
        }
    }

    const company = await Company.findById(ticket.companyId);
    let baseCost = 0;

    // Custom Cost Logic: 
    // 1. If company has a fixed custom cost per ticket, use it
    if (company?.useCustomCost && company.customCostPerTicket > 0) {
        baseCost = company.customCostPerTicket;
    } else {
        // 2. Use problem-specific costs from company or the global problem rate
        baseCost = ticket.problems.reduce((sum, p) => {
            const problemIdStr = p.problemId?.toString();
            // Use .get() for Mongoose Map and cast to any to avoid TS index signature issues
            const customRate = problemIdStr ? (company?.problemCosts as any)?.get(problemIdStr) : undefined;
            
            const rate = (typeof customRate === 'number') ? customRate : p.costPerHour;
            const problemCost = Math.round(rate * 100) / 100;
            
            // Update the individual problem cost if we used a company-specific rate
            if (typeof customRate === 'number' && !p.manualCost) {
                p.cost = problemCost;
            }
            
            return sum + (p.cost || 0);
        }, 0);
    }

    ticket.cost = Math.round(baseCost * 100) / 100;
    
    // Automatic IVA calculation (16%)
    if (ticket.requiresInvoice) {
        ticket.taxAmount = Math.round((ticket.cost * 0.16) * 100) / 100;
    } else {
        ticket.taxAmount = 0;
    }
    
    ticket.totalCost = Math.round((ticket.cost + ticket.taxAmount) * 100) / 100;
    ticket.status = 'solved';
    ticket.solvedAt = new Date();
    if (comments) {
        ticket.operatorComments = comments;
    }
    await ticket.save();

    try {
        if (company && company.email) {
            await sendTicketResolutionEmail(
                company.email, 
                ticket.ticketNumber, 
                comments || '', 
                company.name, 
                Number(ticket.totalCost) || 0, 
                Boolean(ticket.requiresInvoice)
            );
        }
    } catch (err) {
        console.error('Error enviando email:', err);
    }

    res.json(ticket);
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tickets/:id/invoice   (empresa autenticada)
// Body: { requiresInvoice: boolean }
// ─────────────────────────────────────────────────────────────────────────────
export const toggleInvoice = asyncHandler(async (req: Request, res: Response) => {
    const tokenCompanyId = (req as any).companyIdFromToken || (req as any).companyId;
    const { requiresInvoice } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) { res.status(404).json({ message: 'Ticket no encontrado' }); return; }

    // Verificar que el ticket pertenezca a la empresa
    if (String(ticket.companyId) !== String(tokenCompanyId)) {
        res.status(403).json({ message: 'No puedes modificar tickets de otra empresa' });
        return;
    }

    ticket.requiresInvoice = Boolean(requiresInvoice);
    
    // Recalculate tax and total if status is solved
    if (ticket.status === 'solved') {
        if (ticket.requiresInvoice) {
            ticket.taxAmount = Math.round((ticket.cost * 0.16) * 100) / 100;
        } else {
            ticket.taxAmount = 0;
        }
        ticket.totalCost = Math.round((ticket.cost + ticket.taxAmount) * 100) / 100;
    }
    
    await ticket.save();

    res.json(ticket);
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tickets/bulk-invoice   (admin)
// Body: { ticketIds: string[] }
// ─────────────────────────────────────────────────────────────────────────────
export const bulkInvoice = asyncHandler(async (req: Request, res: Response) => {
    const { ticketIds } = req.body;
    if (!ticketIds || !Array.isArray(ticketIds)) {
        res.status(400).json({ message: 'Se requiere un arreglo de ticketIds' });
        return;
    }
    
    await Ticket.updateMany(
        { _id: { $in: ticketIds } },
        { $set: { invoiced: true } }
    );
    
    res.json({ message: 'Tickets marcados como facturados exitosamente' });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tickets/:id   (admin)
// ─────────────────────────────────────────────────────────────────────────────
export const updateTicket = asyncHandler(async (req: Request, res: Response) => {
    const { companyId, problems: rawProblems, description, archived } = req.body;
    const imagePath = req.file ? req.file.path : undefined;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) { res.status(404).json({ message: 'Ticket no encontrado' }); return; }

    if (companyId) {
        const company = await Company.findById(companyId);
        if (!company) { res.status(404).json({ message: 'Empresa no encontrada' }); return; }
        ticket.companyId = companyId;
    }

    if (description !== undefined) ticket.description = description;
    if (archived !== undefined) ticket.archived = archived === 'true' || archived === true;
    if (imagePath) ticket.imagePath = imagePath;

    if (rawProblems) {
        let problemsInput: any[] = [];
        try { problemsInput = typeof rawProblems === 'string' ? JSON.parse(rawProblems) : rawProblems; } catch { problemsInput = []; }
        
        if (problemsInput.length > 0) {
            const problemEntries = await Promise.all(
                problemsInput.map(async (p: any) => {
                    if (p.problemId) {
                        const doc = await Problem.findById(p.problemId);
                        return {
                            problemId: p.problemId,
                            title: doc?.title ?? p.title ?? 'Desconocido',
                            costPerHour: doc?.costPerHour ?? 0,
                            timeSpentMinutes: 0,
                            cost: 0,
                            manualCost: false
                        };
                    } else {
                        return {
                            problemId: null,
                            title: p.title || 'Otros / Sin categoría',
                            costPerHour: 0,
                            timeSpentMinutes: 0,
                            cost: 0,
                            manualCost: false
                        };
                    }
                })
            );
            ticket.problems = problemEntries as any;
        }
    }

    await ticket.save();
    res.json(ticket);
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/tickets/bulk-delete   (admin)
// ─────────────────────────────────────────────────────────────────────────────
export const bulkDeleteTickets = asyncHandler(async (req: Request, res: Response) => {
    const { ticketIds } = req.body;
    if (!ticketIds || !Array.isArray(ticketIds)) {
        res.status(400).json({ message: 'Se requiere un arreglo de ticketIds' });
        return;
    }
    
    console.log(`[DB] Bulk deleting tickets: ${ticketIds.length} items`);
    await Ticket.deleteMany({ _id: { $in: ticketIds } });
    res.json({ message: 'Tickets eliminados correctamente' });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tickets/bulk-archive   (admin)
// ─────────────────────────────────────────────────────────────────────────────
export const bulkArchiveTickets = asyncHandler(async (req: Request, res: Response) => {
    const { ticketIds, archived } = req.body;
    if (!ticketIds || !Array.isArray(ticketIds)) {
        res.status(400).json({ message: 'Se requiere un arreglo de ticketIds' });
        return;
    }
    
    await Ticket.updateMany(
        { _id: { $in: ticketIds } },
        { $set: { archived: archived ?? true } }
    );
    res.json({ message: 'Estado de archivo actualizado correctamente' });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/tickets/:id   (admin)
// ─────────────────────────────────────────────────────────────────────────────
export const deleteTicket = asyncHandler(async (req: Request, res: Response) => {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) { res.status(404).json({ message: 'Ticket no encontrado' }); return; }
    
    console.log(`[DB] Deleting individual ticket: ${req.params.id}`);
    await Ticket.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ticket eliminado correctamente' });
});