import TicketCounter from '../models/TicketCounter';
import { ICompany } from '../models/Company';

export const generateTicketNumber = async (company: ICompany): Promise<string> => {
    const today = new Date().toISOString().slice(0, 10);
    let counter = await TicketCounter.findOne({ companyId: company._id as any, date: today });
    if (!counter) {
        counter = await TicketCounter.create({ companyId: company._id as any, date: today, sequence: 0 });
    }
    counter.sequence += 1;
    await counter.save();
    const paddedSeq = counter.sequence.toString().padStart(4, '0');
    return `${company.code}-${today.replace(/-/g, '')}-${paddedSeq}`;
};