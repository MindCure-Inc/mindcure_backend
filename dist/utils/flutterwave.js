"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Flutterwave = require('flutterwave-node-v3');
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const flutterWaveKey = process.env.FLUTTERWAVE_PUBLIC_KEY;
const flutterWaveSecret = process.env.FLUTTERWAVE_SECRET_KEY;
if (!flutterWaveKey || !flutterWaveSecret) {
    throw new Error('Missing Flutterwave Public Key or Flutterwave Secret Key. Please set FLUTTERWAVE_PUBLIC_KEY in your .env.local file.');
}
const flw = new Flutterwave(flutterWaveKey, flutterWaveSecret);
exports.default = flw;
