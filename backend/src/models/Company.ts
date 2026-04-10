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
    matchPassword(enteredPassword: string): Promise<boolean>;
    createdAt: Date;
}

const CompanySchema = new Schema<ICompany>({
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    costPerTicket: { type: Number, default: 0 },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    loginUsername: { type: String, unique: true, sparse: true, trim: true },
    password: { type: String, select: false },
    logoUrl: { type: String, trim: true },
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