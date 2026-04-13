import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ICompany extends Document {
    name: string;
    code: string;
    costPerTicket: number;
    email?: string;
    loginUsername?: string;
    password?: string;
    logoUrl?: string; // NEW
    rfc?: string;
    useCustomCost: boolean;
    customCostPerTicket: number;
    problemCosts?: Map<string, number>; // NEW: Custom costs per problem for this company
    matchPassword(enteredPassword: string): Promise<boolean>;
    createdAt: Date;
}

const CompanySchema = new Schema<ICompany>({
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    costPerTicket: { type: Number, default: 0 },
    useCustomCost: { type: Boolean, default: false },
    customCostPerTicket: { type: Number, default: 0 },
    problemCosts: { type: Map, of: Number, default: {} }, // NEW
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    loginUsername: { type: String, unique: true, sparse: true, trim: true },
    password: { type: String, select: false },
    logoUrl: { type: String, trim: true },
    rfc: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now }
});

CompanySchema.pre('save', async function (this: any, next) {
    if (!this.isModified('password') || !this.password) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

CompanySchema.methods.matchPassword = async function (enteredPassword: string) {
    if (!this.password) return false;
    return bcrypt.compare(enteredPassword, this.password);
};

export default model<ICompany>('Company', CompanySchema);