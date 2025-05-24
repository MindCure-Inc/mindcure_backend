"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    static info(message, ...args) {
        console.log(`[INFO] [${new Date().toISOString()}]`, message, ...args);
    }
    static warn(message, ...args) {
        console.warn(`[WARN] [${new Date().toISOString()}]`, message, ...args);
    }
    static error(message, ...args) {
        console.error(`[ERROR] [${new Date().toISOString()}]`, message, ...args);
    }
}
exports.Logger = Logger;
