import { Router } from 'express';
// import { getPrivateMessages, getGroupMessagesController } from '../controllers/chat.controller';
// import { requireClerkAuth } from '../middleware/auth'; 

const router = Router();

// TODO: Add Clerk auth middleware if available
// router.use(requireClerkAuth);

// router.get('/private/:userA/:userB', getPrivateMessages);
// router.get('/group/:groupId', getGroupMessagesController);

export default router; 