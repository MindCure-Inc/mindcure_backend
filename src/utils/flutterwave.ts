const Flutterwave = require('flutterwave-node-v3');
import dotenv from "dotenv";

dotenv.config();

const flutterWaveKey = process.env.FLUTTERWAVE_PUBLIC_KEY;
const flutterWaveSecret = process.env.FLUTTERWAVE_SECRET_KEY;
if (!flutterWaveKey || !flutterWaveSecret) {
  throw new Error(
    'Missing Flutterwave Public Key or Flutterwave Secret Key. Please set FLUTTERWAVE_PUBLIC_KEY in your .env.local file.'
  );
}

const flw = new Flutterwave (flutterWaveKey, flutterWaveSecret);

export default flw;