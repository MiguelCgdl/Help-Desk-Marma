"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const TicketCounterSchema = new mongoose_1.Schema({
    companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true },
    date: { type: String, required: true },
    sequence: { type: Number, default: 0 }
});
TicketCounterSchema.index({ companyId: 1, date: 1 }, { unique: true });
exports.default = (0, mongoose_1.model)('TicketCounter', TicketCounterSchema);
