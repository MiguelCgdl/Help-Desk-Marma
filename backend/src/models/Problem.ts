import { Schema, model, Document } from 'mongoose';

export interface IProblem extends Document {
    title: string;
    description?: string;
    active: boolean;
    costPerHour: number;
}

const ProblemSchema = new Schema<IProblem>({
    title: { type: String, required: true, unique: true },
    description: { type: String },
    active: { type: Boolean, default: true },
    costPerHour: { type: Number, default: 0, min: 0 }
});

export default model<IProblem>('Problem', ProblemSchema);