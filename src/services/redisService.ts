import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export async function saveMessage(from: string, to: string, content: string) {
  const key = `chat:${[from, to].sort().join(':')}`;
  const message = JSON.stringify({ from, to, content, timestamp: Date.now() });
  await redis.rpush(key, message);
}

export async function getMessagesForUser(userA: string, userB: string) {
  const key = `chat:${[userA, userB].sort().join(':')}`;
  const messages = await redis.lrange(key, 0, -1);
  return messages.map((msg: string) => JSON.parse(msg));
}

export async function saveGroupMessage(groupId: string, from: string, content: string) {
  const key = `groupchat:${groupId}`;
  const message = JSON.stringify({ from, content, timestamp: Date.now() });
  await redis.rpush(key, message);
}

export async function getGroupMessages(groupId: string) {
  const key = `groupchat:${groupId}`;
  const messages = await redis.lrange(key, 0, -1);
  return messages.map((msg: string) => JSON.parse(msg));
} 