import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WalletService } from './wallet.service';

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

  describe('getAddress', () => {
    it('should return the wallet address', async () => {
      const address = await walletService.getAddress();
      expect(address).toBe('0x1234567890123456789012345678901234567890');
    });
  });

  describe('getUsdcBalance', () => {
    it('should return the USDC balance', async () => {
      const balance = await walletService.getUsdcBalance();
      expect(balance).toBe(BigInt(100500000)); // 100.5 USDC with 6 decimals
    });
  });

  describe('sendTransaction', () => {
    it('should send a transaction successfully', async () => {
      const txHash = await walletService.sendTransaction({
        to: '0xrecipient',
        data: '0xdata',
      });
      expect(txHash).toBe('0xmocktransactionhash');
    });
  });

  describe('sendBatchTransaction', () => {
    it('should execute batch transactions successfully', async () => {
      const txHash = await walletService.sendBatchTransaction([
        { to: '0xrecipient1', value: BigInt(100), data: '0xdata1' },
        { to: '0xrecipient2', data: '0xdata2' },
      ]);
      expect(txHash).toBe('0xmockbatchtrxhash');
    });
  });

  describe('sendSponsoredTransaction', () => {
    it('should send a sponsored transaction successfully', async () => {
      const txHash = await walletService.sendSponsoredTransaction(
        { to: '0xrecipient', data: '0xdata' },
        'https://paymaster.example.com',
      );
      expect(txHash).toBe('0xmocksponsoredtrxhash');
    });
  });

  describe('getExplorerUrl', () => {
    it('should return the transaction URL', () => {
      const url = walletService.getExplorerUrl('0xtxhash');
      expect(url).toBe('https://sepolia.basescan.org/tx/0xtxhash');
    });
  });

  describe('transferEth', () => {
    it('should transfer ETH successfully', async () => {
      const txHash = await walletService.transferEth(
        '0xrecipient',
        BigInt(1000000000000000000), // 1 ETH
      );
      expect(txHash).toBe('0xmocktransactionhash');
    });
  });

  describe('transferUsdc', () => {
    it('should transfer USDC successfully', async () => {
      const txHash = await walletService.transferUsdc(
        '0xrecipient',
        BigInt(1000000), // 1 USDC
      );
      expect(txHash).toBe('0xmocktransactionhash');
    });
  });
});
