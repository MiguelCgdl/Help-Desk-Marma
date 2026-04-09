"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const companyController_1 = require("../controllers/companyController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.route('/').get(auth_1.protect, companyController_1.getCompanies).post(auth_1.protect, companyController_1.createCompany);
router.route('/:id').put(auth_1.protect, companyController_1.updateCompany).delete(auth_1.protect, companyController_1.deleteCompany);
exports.default = router;
