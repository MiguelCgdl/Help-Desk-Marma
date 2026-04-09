"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTicketNumber = void 0;
const TicketCounter_1 = __importDefault(require("../models/TicketCounter"));
const generateTicketNumber = async (company) => {
    const today = new Date().toISOString().slice(0, 10);
    let counter = await TicketCounter_1.default.findOne({ companyId: company._id, date: today });
    if (!counter) {
        counter = await TicketCounter_1.default.create({ companyId: company._id, date: today, sequence: 0 });
    }
    counter.sequence += 1;
    await counter.save();
    const paddedSeq = counter.sequence.toString().padStart(4, '0');
    return `${company.code}-${today.replace(/-/g, '')}-${paddedSeq}`;
};
exports.generateTicketNumber = generateTicketNumber;
