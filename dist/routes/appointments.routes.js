"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const appointments_controller_1 = require("../controllers/appointments.controller");
const express_2 = require("@clerk/express");
const router = express_1.default.Router();
router.post('/book', (0, express_2.requireAuth)(), appointments_controller_1.bookSession);
router.put('/update/:id', (0, express_2.requireAuth)(), appointments_controller_1.updateSession);
router.delete('/cancel/:id', (0, express_2.requireAuth)(), appointments_controller_1.cancelSession);
router.get('/sessions', (0, express_2.requireAuth)(), appointments_controller_1.getSessions);
router.get('/session/:id', (0, express_2.requireAuth)(), appointments_controller_1.getSessionById);
exports.default = router;
