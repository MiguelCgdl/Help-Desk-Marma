"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const problemController_1 = require("../controllers/problemController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.route('/').get(auth_1.protect, problemController_1.getProblems).post(auth_1.protect, problemController_1.createProblem);
router.route('/:id').put(auth_1.protect, problemController_1.updateProblem).delete(auth_1.protect, problemController_1.deleteProblem);
exports.default = router;
