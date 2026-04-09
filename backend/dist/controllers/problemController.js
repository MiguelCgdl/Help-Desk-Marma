"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProblem = exports.updateProblem = exports.createProblem = exports.getProblems = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Problem_1 = __importDefault(require("../models/Problem"));
exports.getProblems = (0, express_async_handler_1.default)(async (req, res) => {
    const problems = await Problem_1.default.find();
    res.json(problems);
});
exports.createProblem = (0, express_async_handler_1.default)(async (req, res) => {
    const problem = await Problem_1.default.create(req.body);
    res.status(201).json(problem);
});
exports.updateProblem = (0, express_async_handler_1.default)(async (req, res) => {
    const problem = await Problem_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(problem);
});
exports.deleteProblem = (0, express_async_handler_1.default)(async (req, res) => {
    await Problem_1.default.findByIdAndDelete(req.params.id);
    res.json({ message: 'Eliminado' });
});
