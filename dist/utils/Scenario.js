"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scenario = void 0;
class Scenario {
    constructor(role, tone) {
        this.role = role;
        this.tone = tone;
    }
    getSystemPrompt(state, userName) {
        throw new Error('Method not implemented.');
    }
}
exports.Scenario = Scenario;
