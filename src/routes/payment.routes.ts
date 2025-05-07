import express from "express";
import {paymentCallback} from "../controllers/payment.controller";

const router = express.Router();

router.get('/payment/callback', paymentCallback);

export default router;