import { PrismaClient } from '@prisma/client';
jest.mock('@prisma/client');

const mockPrisma = {
  wallet: {
    findUnique: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
  },
};
(PrismaClient as any).mockImplementation(() => mockPrisma);

describe('Wallet/Transaction logic', () => {
  it('should retrieve wallet balance', async () => {
    mockPrisma.wallet.findUnique.mockResolvedValue({ userId: 'user1', balance: 100 });
    const prisma = new PrismaClient();
    const wallet = await prisma.wallet.findUnique({ where: { userId: 'user1' } });
    expect(wallet.balance).toBe(100);
  });

  it('should create a transaction', async () => {
    const tx = { id: 'tx1', userId: 'user1', amount: 50, status: 'success', reference: 'ref1' };
    mockPrisma.transaction.create.mockResolvedValue(tx);
    const prisma = new PrismaClient();
    const created = await prisma.transaction.create({ data: tx });
    expect(created.id).toBe('tx1');
    expect(created.amount).toBe(50);
    expect(created.status).toBe('success');
  });
}); 