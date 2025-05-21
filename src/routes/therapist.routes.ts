import { Router } from "express";
import { updateTherapistDetail } from "../controllers/therapist.controller";

const router = Router()

router.put("/therapist/update/:externalId", updateTherapistDetail)

export default router