"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const CompanySchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    costPerTicket: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});
exports.default = (0, mongoose_1.model)('Company', CompanySchema);
