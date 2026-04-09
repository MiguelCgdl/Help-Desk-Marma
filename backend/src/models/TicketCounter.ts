import { Schema, model, Document } from 'mongoose';

export interface ITicketCounter extends Document {
    companyId: Schema.Types.ObjectId;
    date: string; // YYYY-MM-DD
    sequence: number;
}

const TicketCounterSchema = new Schema<ITicketCounter>({
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    date: { type: String, required: true },
    sequence: { type: Number, default: 0 }
});

TicketCounterSchema.index({ companyId: 1, date: 1 }, { unique: true });
export default model<ITicketCounter>('TicketCounter', TicketCounterSchema);