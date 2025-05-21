import * as redisService from '../services/redisService';
import Redis from 'ioredis-mock';

// Patch redisService to use the mock Redis
const mockRedis = new Redis();
(redisService as any).redis = mockRedis;

describe('redisService', () => {
  beforeEach(async () => {
    await mockRedis.flushall();
  });

  it('should save and retrieve private messages', async () => {
    await redisService.saveMessage('alice', 'bob', 'Hello Bob!');
    const messages = await redisService.getMessagesForUser('alice', 'bob');
    expect(messages.length).toBe(1);
    expect(messages[0].from).toBe('alice');
    expect(messages[0].to).toBe('bob');
    expect(messages[0].content).toBe('Hello Bob!');
  });

  it('should save and retrieve group messages', async () => {
    await redisService.saveGroupMessage('group1', 'alice', 'Hello Group!');
    const messages = await redisService.getGroupMessages('group1');
    expect(messages.length).toBe(1);
    expect(messages[0].from).toBe('alice');
    expect(messages[0].content).toBe('Hello Group!');
  });
}); 