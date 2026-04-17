import { Schema, model, Document } from 'mongoose';

export interface IProblem extends Document {
    title: string; // Identifier
    mainCategory: string;
    subcategory: string;
    specificType: string;
    firstResponseTime: string;
    targetResolutionTime: string;
    priority: string;
    active: boolean;
    costPerHour: number;
}

const ProblemSchema = new Schema<IProblem>({
    title: { type: String, required: true, unique: true },
    mainCategory: { type: String },
    subcategory: { type: String },
    specificType: { type: String },
    firstResponseTime: { type: String },
    targetResolutionTime: { type: String },
    priority: { type: String },
    active: { type: Boolean, default: true },
    costPerHour: { type: Number, default: 0, min: 0 }
});

export default model<IProblem>('Problem', ProblemSchema);