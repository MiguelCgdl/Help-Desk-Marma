import { IInvoice } from '../models/Invoice';
import { IBillingConfig } from '../models/BillingConfig';
import { ICompany } from '../models/Company';

/**
 * Servicio de Facturación Marmacore
 * Prepara la integración para PACs de México (Facturama/SW Sapien/etc)
 */
export const billingService = {
    /**
     * Simula o realiza el timbrado ante un PAC
     */
    async stampInvoice(invoice: IInvoice, config: IBillingConfig, company: ICompany) {
        // Aquí iría la llamada al API del PAC (ej: Facturama)
        console.log(`[PAC] Timbrando factura ${invoice.invoiceNumber} para RFC ${company.rfc}`);
        
        if (config.isTestMode) {
            return {
                uuid: `TEST-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                xmlUrl: 'mock-xml-url',
                pdfUrl: 'mock-pdf-url'
            };
        }

        // Si fuera real:
        // const response = await axios.post('facturama-api/api/v3/cfdi', {...});
        // return response.data;
        
        throw new Error('PAC no configurado para producción');
    },

    /**
     * Generación de PDF Local (Placeholder)
     */
    async generateInvoicePDF(invoice: IInvoice, company: ICompany) {
        // En un futuro usamos jspdf o pdfkit
        return `invoice-pdf-${invoice.invoiceNumber}.pdf`;
    }
};
