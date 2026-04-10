import { Schema, model, Document } from 'mongoose';

// ─── Sub-document: one problem entry inside a ticket ───────────────────────
export interface IProblemEntry {
    problemId: Schema.Types.ObjectId | null; // null = "Otros"
    title: string;                            // snapshot at creation time
    costPerHour: number;                      // snapshot at creation time
    timeSpentMinutes: number;                 // filled when solving
    cost: number;                             // computed or manual
    manualCost?: boolean;                     // true if admin set cost manually
}

const ProblemEntrySchema = new Schema<IProblemEntry>(
    {
        problemId: { type: Schema.Types.ObjectId, ref: 'Problem', default: null },
        title: { type: String, required: true },
        costPerHour: { type: Number, default: 0 },
        timeSpentMinutes: { type: Number, default: 0, min: 0 },
        cost: { type: Number, default: 0, min: 0 },
        manualCost: { type: Boolean, default: false }
    },
    { _id: false }
);

// ─── Main Ticket ────────────────────────────────────────────────────────────
export interface ITicket extends Document {
    ticketNumber: string;
    companyId: Schema.Types.ObjectId;
    problems: IProblemEntry[];          // NEW – array of problems
    description: string;
    imagePath?: string;
    cost: number;                       // total cost (sum of problems)
    status: 'open' | 'solved';
    solvedAt?: Date;
    requiresInvoice?: boolean;
    invoiced?: boolean;
    operatorComments?: string;
    createdAt: Date;
    // Legacy fields kept so existing tickets don't break
    problemId?: Schema.Types.ObjectId;
    timeSpentMinutes?: number;
    costPerHourSnapshot?: number;
}

const TicketSchema = new Schema<ITicket>({
    ticketNumber:       { type: String, required: true, unique: true },
    companyId:          { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    problems:           { type: [ProblemEntrySchema], default: [] },
    description:        { type: String, required: true, maxlength: 800 },
    imagePath:          { type: String },
    cost:               { type: Number, required: true, default: 0 },
    status:             { type: String, enum: ['open', 'solved'], default: 'open' },
    solvedAt:           { type: Date },
    requiresInvoice:    { type: Boolean, default: false },
    invoiced:           { type: Boolean, default: false },
    operatorComments:   { type: String },
    createdAt:          { type: Date, default: Date.now },
    // Legacy
    problemId:          { type: Schema.Types.ObjectId, ref: 'Problem' },
    timeSpentMinutes:   { type: Number, min: 0 },
    costPerHourSnapshot:{ type: Number, min: 0 }
});

export default model<ITicket>('Ticket', TicketSchema);