"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const TicketSchema = new mongoose_1.Schema({
    ticketNumber: { type: String, required: true, unique: true },
    companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true },
    problemId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Problem', required: true },
    description: { type: String, required: true, maxlength: 800 },
    imagePath: { type: String },
    cost: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});
exports.default = (0, mongoose_1.model)('Ticket', TicketSchema);
