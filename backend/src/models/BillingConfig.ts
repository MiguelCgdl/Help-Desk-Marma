import { Schema, model, Document } from 'mongoose';

export interface IBillingConfig extends Document {
    razonSocial: string;
    rfc: string;
    regimenFiscal: string;
    codigoPostal: string;
    pacUsername?: string;
    pacPassword?: string;
    isTestMode: boolean;
}

const BillingConfigSchema = new Schema<IBillingConfig>({
    razonSocial: { type: String, required: true },
    rfc: { type: String, required: true },
    regimenFiscal: { type: String, required: true },
    codigoPostal: { type: String, required: true },
    pacUsername: { type: String },
    pacPassword: { type: String },
    isTestMode: { type: Boolean, default: true }
});

export default model<IBillingConfig>('BillingConfig', BillingConfigSchema);
