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

export const importProblems = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('No se subió ningún archivo');
    }

    const csvData = req.file.buffer.toString('utf8');
    const lines = csvData.split(/\r?\n/);
    
    // Skip header
    const dataLines = lines.slice(1).filter(line => line.trim() !== '');
    
    const problemsToUpsert = dataLines.map(line => {
        // Simple CSV split (doesn't handle commas inside quotes, but for this use case it might be enough)
        // If needed, I can implement a more robust parser.
        const [title, mainCategory, subcategory, specificType, firstResponseTime, targetResolutionTime, priority, costPerHour] = line.split(',');
        
        return {
            title: title?.trim(),
            mainCategory: mainCategory?.trim(),
            subcategory: subcategory?.trim(),
            specificType: specificType?.trim(),
            firstResponseTime: firstResponseTime?.trim(),
            targetResolutionTime: targetResolutionTime?.trim(),
            priority: priority?.trim() || 'Baja',
            costPerHour: Number(costPerHour) || 0,
            active: true
        };
    }).filter(p => p.title); // Must have a title

    const results = {
        created: 0,
        updated: 0,
        errors: 0
    };

    for (const p of problemsToUpsert) {
        try {
            const existing = await Problem.findOne({ title: p.title });
            if (existing) {
                await Problem.findByIdAndUpdate(existing._id, p);
                results.updated++;
            } else {
                await Problem.create(p);
                results.created++;
            }
        } catch (err) {
            console.error('Error importing problem:', err);
            results.errors++;
        }
    }

    res.json({
        message: 'Importación finalizada',
        results
    });
});