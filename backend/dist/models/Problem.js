"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ProblemSchema = new mongoose_1.Schema({
    title: { type: String, required: true, unique: true },
    description: { type: String },
    active: { type: Boolean, default: true }
});
exports.default = (0, mongoose_1.model)('Problem', ProblemSchema);
