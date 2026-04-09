import { Schema, model, Document } from 'mongoose';

export interface ITicket extends Document {
    ticketNumber: string;
    companyId: Schema.Types.ObjectId;
    problemId: Schema.Types.ObjectId;
    description: string;
    imagePath?: string;
    cost: number;
    status: 'open' | 'solved';
    solvedAt?: Date;
    timeSpentMinutes?: number;
    costPerHourSnapshot?: number;
    createdAt: Date;
}

const TicketSchema = new Schema<ITicket>({
    ticketNumber: { type: String, required: true, unique: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
    description: { type: String, required: true, maxlength: 800 },
    imagePath: { type: String },
    cost: { type: Number, required: true },
    status: { type: String, enum: ['open', 'solved'], default: 'open' },
    solvedAt: { type: Date },
    timeSpentMinutes: { type: Number, min: 0 },
    costPerHourSnapshot: { type: Number, min: 0 },
    createdAt: { type: Date, default: Date.now }
});

export default model<ITicket>('Ticket', TicketSchema);