import { Schema, model, Document } from 'mongoose';

export interface IInvoice extends Document {
    company: Schema.Types.ObjectId;
    invoiceNumber: string; // Folio interno
    uuid?: string; // UUID del SAT tras timbrado
    status: 'draft' | 'sent' | 'canceled';
    subtotal: number;
    iva: number;
    total: number;
    tickets: Schema.Types.ObjectId[];
    pdfUrl?: string;
    xmlUrl?: string;
    createdAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>({
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    invoiceNumber: { type: String, required: true, unique: true },
    uuid: { type: String },
    status: { type: String, enum: ['draft', 'sent', 'canceled'], default: 'draft' },
    subtotal: { type: Number, required: true },
    iva: { type: Number, required: true },
    total: { type: Number, required: true },
    tickets: [{ type: Schema.Types.ObjectId, ref: 'Ticket' }],
    pdfUrl: { type: String },
    xmlUrl: { type: String },
    createdAt: { type: Date, default: Date.now }
});

export default model<IInvoice>('Invoice', InvoiceSchema);
