import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Ticket from '../models/Ticket';
import Company from '../models/Company';
import Invoice from '../models/Invoice';
import BillingConfig from '../models/BillingConfig';
import { billingService } from '../services/billingService';

// Obtener configuración fiscal actual
export const getBillingConfig = asyncHandler(async (req, res) => {
    let config = await BillingConfig.findOne();
    if (!config) {
        // Valores por defecto si no existe
        config = await BillingConfig.create({
            razonSocial: 'MARMACORE S.A. DE C.V.',
            rfc: 'MAR123456789',
            regimenFiscal: '601',
            codigoPostal: '00000'
        });
    }
    res.json(config);
});

// Guardar configuración fiscal
export const updateBillingConfig = asyncHandler(async (req, res) => {
    let config = await BillingConfig.findOne();
    if (config) {
        Object.assign(config, req.body);
        await config.save();
    } else {
        config = await BillingConfig.create(req.body);
    }
    res.json(config);
});

// Obtener tickets pendientes de facturar por empresa
export const getPendingTickets = asyncHandler(async (req, res) => {
    const { companyId } = req.params;
    const tickets = await Ticket.find({
        companyId,
        status: 'solved',
        invoiced: { $ne: true }
    });
    res.json(tickets);
});

// Generar Corte de Mes e Invoice
export const createMonthlyCut = asyncHandler(async (req, res) => {
    const { companyId, ticketIds } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
        res.status(404).json({ message: 'Empresa no encontrada' });
        return;
    }

    const tickets = await Ticket.find({ _id: { $in: ticketIds }, invoiced: { $ne: true } });
    if (tickets.length === 0) {
        res.status(400).json({ message: 'No hay tickets válidos para facturar' });
        return;
    }

    // Calcular Totales
    let subtotal = 0;
    let iva = 0;
    tickets.forEach(t => {
        subtotal += t.cost;
        iva += t.taxAmount || 0;
    });
    const total = subtotal + iva;

    // Crear Registro de Invoice
    const count = await Invoice.countDocuments();
    const invoiceNumber = `FAC-${1000 + count}`;

    const invoice = await Invoice.create({
        company: companyId,
        invoiceNumber,
        subtotal: Math.round(subtotal * 100) / 100,
        iva: Math.round(iva * 100) / 100,
        total: Math.round(total * 100) / 100,
        tickets: ticketIds,
        status: 'draft'
    });

    // Marcar tickets como facturados
    await Ticket.updateMany(
        { _id: { $in: ticketIds } },
        { $set: { invoiced: true, invoiceId: invoice._id } }
    );

    res.status(201).json(invoice);
});

// Timbrar y Finalizar Factura
export const finalizeInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const invoice = await Invoice.findById(id).populate('company');
    const config = await BillingConfig.findOne();

    if (!invoice || !config) {
        res.status(404).json({ message: 'Factura o configuración no encontrada' });
        return;
    }

    try {
        const result = await billingService.stampInvoice(invoice, config, invoice.company as any);
        
        invoice.uuid = result.uuid;
        invoice.xmlUrl = result.xmlUrl;
        invoice.pdfUrl = result.pdfUrl;
        invoice.status = 'sent';
        await invoice.save();

        res.json(invoice);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export const getInvoices = asyncHandler(async (req, res) => {
    const invoices = await Invoice.find().populate('company', 'name rfc').sort('-createdAt');
    res.json(invoices);
});
