import { Test, TestingModule } from '@nestjs/testing';
import { AgentService } from './agent.service';
import { OpenAISingleton, PerplexitySingleton } from '../shared/singletons';
import { WalletAgentTool, PlanGeneratorTool } from './tools';
import {
  PlanningResponse,
  ResearchResponse,
  JudgeResponse,
  WalletResult,
} from './types/agent.types';

describe('AgentService', () => {
  let agentService: AgentService;
  let openAI: OpenAISingleton;
  let perplexity: PerplexitySingleton;
  let walletTool: WalletAgentTool;
  let planGenerator: PlanGeneratorTool;

  const mockPlan: PlanningResponse = {
    goal: 'Check wallet balance',
    constraints: ['Low risk tolerance'],
    steps: [
      {
        step_number: 1,
        title: 'Check wallet balance',
        type: 'execution',
        description: 'Check the current balance of the wallet',
        expected_outcome: 'Current wallet balance information',
      },
    ],
    estimated_timeline: '1 minute',
    success_metrics: ['Wallet balance retrieved'],
  };

  const mockResearch: ResearchResponse = {
    findings: [
      {
        topic: 'Wallet Balance',
        summary: 'Checking wallet balance is a common operation',
        relevance_score: 0.9,
        sources: ['https://example.com/wallet-guide'],
      },
    ],
    overall_assessment: 'The plan is feasible and straightforward',
  };

  const mockJudgeApproved: JudgeResponse = {
    decision: 'approved',
    reasoning: 'The plan is simple and achieves the user intent',
    risk_assessment: {
      financial_risk: 'low',
      technical_risk: 'low',
      compliance_risk: 'low',
    },
    improvement_suggestions: [],
  };

  const mockJudgeRevision: JudgeResponse = {
    decision: 'needs_revision',
    reasoning: 'The plan lacks detail',
    risk_assessment: {
      financial_risk: 'low',
      technical_risk: 'medium',
      compliance_risk: 'low',
    },
    improvement_suggestions: ['Add more detail to the steps'],
  };

  const mockWalletResult: WalletResult = {
    success: true,
    message: 'Wallet balance retrieved successfully',
    address: '0x123456789abcdef',
    balance: 100.5,
    explorerUrl: 'https://explorer.example.com/address/0x123456789abcdef',
  };

  beforeEach(async () => {
    // Create mock services
    const openAIMock = {
      think: jest.fn().mockResolvedValue('Mock response'),
    };

    const perplexityMock = {
      research: jest.fn().mockResolvedValue('Mock research response'),
    };

    const walletToolMock = {
      execute: jest.fn().mockResolvedValue(mockWalletResult),
      analyzeTransactionSafety: jest.fn().mockResolvedValue({
        safe: true,
        reason: 'Transaction appears safe',
      }),
    };

    const planGeneratorMock = {
      generatePlan: jest.fn().mockResolvedValue({
        success: true,
        plan: mockPlan,
      }),
      refinePlan: jest.fn().mockResolvedValue({
        success: true,
        plan: mockPlan,
      }),
      extractWalletOperations: jest.fn().mockResolvedValue({
        type: 'check_balance',
        parameters: {},
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentService,
        { provide: OpenAISingleton, useValue: openAIMock },
        { provide: PerplexitySingleton, useValue: perplexityMock },
        { provide: WalletAgentTool, useValue: walletToolMock },
        { provide: PlanGeneratorTool, useValue: planGeneratorMock },
      ],
    }).compile();

    agentService = module.get<AgentService>(AgentService);
    openAI = module.get<OpenAISingleton>(OpenAISingleton);
    perplexity = module.get<PerplexitySingleton>(PerplexitySingleton);
    walletTool = module.get<WalletAgentTool>(WalletAgentTool);
    planGenerator = module.get<PlanGeneratorTool>(PlanGeneratorTool);

    // Mock private methods using any type assertion
    (agentService as any).parseJsonResponse = jest
      .fn()
      .mockImplementation((response) => {
        if (response === 'Mock research response') {
          return mockResearch;
        }
        return mockJudgeApproved;
      });
  });

  it('should be defined', () => {
    expect(agentService).toBeDefined();
  });

  describe('processMessage', () => {
    it('should process a message and return a completed response', async () => {
      const result = await agentService.processMessage({
        message: 'Check my wallet balance',
        preferences: { riskTolerance: 'low' },
      });

      expect(result.status).toBe('completed');
      expect(result.plan).toBeDefined();
      expect(result.research).toBeDefined();
      expect(result.decision).toBeDefined();
      expect(result.wallet).toBeDefined();
      expect(planGenerator.generatePlan).toHaveBeenCalled();
      expect(perplexity.research).toHaveBeenCalled();
      expect(openAI.think).toHaveBeenCalled();
      expect(planGenerator.extractWalletOperations).toHaveBeenCalled();
      expect(walletTool.execute).toHaveBeenCalled();
    });

    it('should handle errors during processing', async () => {
      jest
        .spyOn(planGenerator, 'generatePlan')
        .mockRejectedValueOnce(new Error('Plan generation failed'));

      const result = await agentService.processMessage({
        message: 'Check my wallet balance',
      });

      expect(result.status).toBe('failed');
      expect(result.message).toContain('error');
    });

    it('should handle plan revision', async () => {
      // Mock judge to request revision first time, then approve
      let callCount = 0;
      (agentService as any).parseJsonResponse = jest
        .fn()
        .mockImplementation((response) => {
          if (response === 'Mock research response') {
            return mockResearch;
          }

          callCount++;
          if (callCount === 1) {
            return mockJudgeRevision;
          }
          return mockJudgeApproved;
        });

      const result = await agentService.processMessage({
        message: 'Check my wallet balance',
      });

      expect(result.status).toBe('completed');
      expect(planGenerator.generatePlan).toHaveBeenCalledTimes(2);
    });

    it('should handle wallet operation failure', async () => {
      // Mock wallet operation to fail
      jest.spyOn(walletTool, 'execute').mockResolvedValueOnce({
        success: false,
        message: 'Wallet operation failed',
        error: 'Connection error',
      });

      const result = await agentService.processMessage({
        message: 'Check my wallet balance',
      });

      expect(result.status).toBe('failed');
      expect(result.message).toContain('Wallet operation failed');
    });

    it('should handle maximum revision cycles', async () => {
      // Mock judge to always request revision
      (agentService as any).parseJsonResponse = jest
        .fn()
        .mockImplementation((response) => {
          if (response === 'Mock research response') {
            return mockResearch;
          }
          return mockJudgeRevision;
        });

      const result = await agentService.processMessage({
        message: 'Check my wallet balance',
      });

      expect(result.status).toBe('failed');
      expect(result.message).toContain('Maximum revision cycles');
    });
  });
});
