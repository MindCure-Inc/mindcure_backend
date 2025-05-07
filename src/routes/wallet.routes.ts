import { Router } from "express";
import {
    createOrGetWallet,
    depositToWallet,
    withdrawFromWallet,
    getWallet
} from "../controllers/wallet.controller"

const router = Router()

router.post("/", createOrGetWallet)
router.post("/deposit", depositToWallet)
router.post("/withdraw", withdrawFromWallet)
router.get("/:userId", getWallet)

export default router