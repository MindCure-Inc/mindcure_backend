"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const therapist_controller_1 = require("../controllers/therapist.controller");
const router = (0, express_1.Router)();
router.put("/therapist/update/:externalId", therapist_controller_1.updateTherapistDetail);
exports.default = router;
