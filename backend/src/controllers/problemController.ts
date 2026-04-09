import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Problem from '../models/Problem';

export const getProblems = asyncHandler(async (req, res) => {
    const problems = await Problem.find();
    res.json(problems);
});

export const createProblem = asyncHandler(async (req, res) => {
    const problem = await Problem.create(req.body);
    res.status(201).json(problem);
});

export const updateProblem = asyncHandler(async (req, res) => {
    const problem = await Problem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(problem);
});

export const deleteProblem = asyncHandler(async (req, res) => {
    await Problem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Eliminado' });
});