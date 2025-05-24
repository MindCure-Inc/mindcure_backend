"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilitySchema = exports.AppointmentSchema = exports.ScenarioStates = void 0;
const zod_1 = require("zod");
var ScenarioStates;
(function (ScenarioStates) {
    ScenarioStates["START"] = "START";
    ScenarioStates["CONTINUE"] = "CONTINUE";
})(ScenarioStates || (exports.ScenarioStates = ScenarioStates = {}));
exports.AppointmentSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    therapistId: zod_1.z.string(),
    appointmentDate: zod_1.z.string().transform((date) => new Date(date)),
    status: zod_1.z.enum(['pending', 'confirmed', 'canceled', "completed"]).default('pending')
});
exports.AvailabilitySchema = zod_1.z.object({
    therapistId: zod_1.z.string(),
    availability: zod_1.z.array(zod_1.z.object({
        dayOfWeek: zod_1.z.string(),
        startTime: zod_1.z.string(),
        endTime: zod_1.z.string()
    }))
});
