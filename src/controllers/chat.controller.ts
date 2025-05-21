import { Request, Response } from 'express';
import { getMessagesForUser, getGroupMessages } from '../services/redisService';

const getPrivateMessages = async (req: Request, res: Response) => {
  const { userA, userB } = req.params;
  if (!userA || !userB) return res.status(400).json({ error: 'Missing user IDs' });
  try {
    const messages = await getMessagesForUser(userA, userB);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

const getGroupMessagesController = async (req: Request, res: Response) => {
  const { groupId } = req.params;
  if (!groupId) return res.status(400).json({ error: 'Missing groupId' });
  try {
    const messages = await getGroupMessages(groupId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch group messages' });
  }
};

export { getPrivateMessages, getGroupMessagesController }; 