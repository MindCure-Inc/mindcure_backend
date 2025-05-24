"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// import { getPrivateMessages, getGroupMessagesController } from '../controllers/chat.controller';
// import { requireClerkAuth } from '../middleware/auth'; 
const router = (0, express_1.Router)();
// TODO: Add Clerk auth middleware if available
// router.use(requireClerkAuth);
// router.get('/private/:userA/:userB', getPrivateMessages);
// router.get('/group/:groupId', getGroupMessagesController);
exports.default = router;
