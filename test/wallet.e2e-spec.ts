import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { WalletService } from '../src/shared/services/wallet.service';
import { WalletAgentTool } from '../src/agent/tools';
import { ConfigService } from '@nestjs/config';

describe('Wallet Integration (e2e)', () => {
  let app: INestApplication;
  let walletService: WalletService;
  let walletTool: WalletAgentTool;
  let configService: ConfigService;

  beforeAll(async () => {
    // Create a test module with the full application
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get services from the application
    walletService = app.get<WalletService>(WalletService);
    walletTool = app.get<WalletAgentTool>(WalletAgentTool);
    configService = app.get<ConfigService>(ConfigService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Wallet Service', () => {
    it('should be defined', () => {
      expect(walletService).toBeDefined();
    });

    it('should have required environment variables', () => {
      expect(configService.get('PRIVATE_KEY')).toBeDefined();
      expect(configService.get('PIMLICO_API_KEY')).toBeDefined();
      expect(configService.get('PIMLICO_RPC')).toBeDefined();
      expect(configService.get('BASE_SCAN_USDC')).toBeDefined();
      expect(configService.get('BASE_SCAN_EXPLORER')).toBeDefined();
    });

    it('should get wallet address', async () => {
      const address = await walletService.getWalletAddress();
      expect(address).toBeDefined();
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should get wallet URL', () => {
      const url = walletService.getWalletUrl();
      expect(url).toBeDefined();
      expect(url).toContain(configService.get('BASE_SCAN_EXPLORER'));
    });

    it('should get USDC balance', async () => {
      const balance = await walletService.getUsdcBalance();
      expect(balance).toBeDefined();
      expect(typeof balance).toBe('number');
    }, 30000); // Increased timeout for blockchain call
  });

  describe('Wallet Agent Tool', () => {
    it('should be defined', () => {
      expect(walletTool).toBeDefined();
    });

    it('should check balance successfully', async () => {
      const result = await walletTool.execute({ action: 'check_balance' });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      if (result.data) {
        expect(result.data.address).toBeDefined();
        expect(result.data.balance).toBeDefined();
        expect(result.data.explorerUrl).toBeDefined();
      }
    }, 30000); // Increased timeout for blockchain call

    it('should analyze transaction safety', async () => {
      const result = await walletTool.analyzeTransactionSafety({
        action: 'send_transaction',
        parameters: {
          to: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', // vitalik.eth
          data: '0x1234',
        },
      });

      expect(result).toBeDefined();
      expect(typeof result.safe).toBe('boolean');
      expect(result.reason).toBeDefined();
    }, 30000); // Increased timeout for LLM call
  });

  describe('Agent API with Wallet Operations', () => {
    it('should process a wallet balance check request', async () => {
      const response = await request(app.getHttpServer())
        .post('/agent/message')
        .send({
          message: 'Check my wallet balance',
          preferences: { riskTolerance: 'low' },
        })
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.status).toBeDefined();

      // The test might not always result in a completed status due to the
      // non-deterministic nature of the agent, but we can check the structure
      if (response.body.status === 'completed') {
        expect(response.body.wallet).toBeDefined();
        expect(response.body.wallet.success).toBe(true);
        expect(response.body.wallet.address).toBeDefined();
        expect(response.body.wallet.balance).toBeDefined();
      }
    }, 60000); // Increased timeout for full agent workflow
  });
});
