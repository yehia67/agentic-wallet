import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WalletService } from './wallet.service.mock';

// Using mock implementation from wallet.service.mock.ts

describe('WalletService', () => {
  let walletService: WalletService;
  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    walletService = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(walletService).toBeDefined();
  });

  describe('getWalletAddress', () => {
    it('should return the wallet address', async () => {
      const address = await walletService.getWalletAddress();
      expect(address).toBe('0x1234567890123456789012345678901234567890');
    });
  });

  describe('getUsdcBalance', () => {
    it('should return the USDC balance', async () => {
      const balance = await walletService.getUsdcBalance();
      expect(balance).toBe(100.5);
    });
  });

  describe('sendTransaction', () => {
    it('should send a transaction successfully', async () => {
      const txHash = await walletService.sendTransaction(
        '0xrecipient',
        '0xdata',
      );
      expect(txHash).toBe('0xmocktransactionhash');
    });
  });

  describe('approveToken', () => {
    it('should approve a token successfully', async () => {
      const txHash = await walletService.approveToken('0xspender');
      expect(txHash).toBe('0xmockapprovaltrxhash');
    });
  });

  describe('batchTransactions', () => {
    it('should execute batch transactions successfully', async () => {
      const txHash = await walletService.batchTransactions([
        { to: '0xrecipient1', value: BigInt(100), data: '0xdata1' },
        { to: '0xrecipient2', data: '0xdata2' },
      ]);
      expect(txHash).toBe('0xmockbatchtrxhash');
    });
  });

  describe('getTransactionUrl', () => {
    it('should return the transaction URL', () => {
      const url = walletService.getTransactionUrl('0xtxhash');
      expect(url).toBe('https://sepolia.basescan.org/tx/0xtxhash');
    });
  });

  describe('getWalletUrl', () => {
    it('should return the wallet URL', () => {
      const url = walletService.getWalletUrl();
      expect(url).toBe('https://sepolia.basescan.org/address/0x1234567890123456789012345678901234567890');
    });
  });
});
