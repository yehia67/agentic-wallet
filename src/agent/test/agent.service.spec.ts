import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AgentService } from '../agent.service';
import { OpenAISingleton, PerplexitySingleton } from '../../shared/singletons';
import {
  mockAgentMessageDto,
  mockAgentResponseDto,
  mockPlanningResponse,
  mockResearchResponse,
  mockJudgeResponse,
  mockOpenAIResponse,
  mockPerplexityResponse,
} from './mocks/agent.mocks';

describe('AgentService', () => {
  let service: AgentService;
  let openAISingleton: OpenAISingleton;
  let perplexitySingleton: PerplexitySingleton;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentService,
        {
          provide: OpenAISingleton,
          useValue: {
            think: jest.fn().mockResolvedValue(mockOpenAIResponse),
          },
        },
        {
          provide: PerplexitySingleton,
          useValue: {
            research: jest.fn().mockResolvedValue(mockPerplexityResponse),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AgentService>(AgentService);
    openAISingleton = module.get<OpenAISingleton>(OpenAISingleton);
    perplexitySingleton = module.get<PerplexitySingleton>(PerplexitySingleton);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processMessage', () => {
    it('should process a message and return a response', async () => {
      // Mock the runCoordinatorWorkflow to return a successful response
      jest
        .spyOn(service as any, 'runCoordinatorWorkflow')
        .mockResolvedValueOnce(mockAgentResponseDto);

      const result = await service.processMessage(mockAgentMessageDto);

      expect(result.status).toBe('completed');
      expect(result.message).toBeDefined();
    });

    it('should handle errors during processing', async () => {
      jest
        .spyOn(openAISingleton, 'think')
        .mockRejectedValueOnce(new Error('Test error'));

      const result = await service.processMessage(mockAgentMessageDto);

      expect(result.status).toBe('failed');
      expect(result.message).toContain('An error occurred');
    });
  });

  describe('runCoordinatorWorkflow', () => {
    it('should run the workflow and return an approved plan', async () => {
      // Mock the agent calls to return expected responses
      jest
        .spyOn(service as any, 'callPlanningAgent')
        .mockResolvedValueOnce(mockPlanningResponse);
      jest
        .spyOn(service as any, 'callResearchAgent')
        .mockResolvedValueOnce(mockResearchResponse);
      jest
        .spyOn(service as any, 'callJudgeAgent')
        .mockResolvedValueOnce(mockJudgeResponse);
      jest
        .spyOn(service as any, 'buildFinalResponse')
        .mockReturnValueOnce(mockAgentResponseDto);

      // Using private method access through any
      const result = await (service as any).runCoordinatorWorkflow({
        userIntent: mockAgentMessageDto.message,
        userPreferences: mockAgentMessageDto.preferences,
        cycleCount: 0,
      });

      expect(result.status).toBe('completed');
      expect(result.plan).toBeDefined();
      expect(result.research).toBeDefined();
      expect(result.decision).toBeDefined();
    });

    it('should handle revision cycles', async () => {
      // Mock judge response to trigger revision
      jest.spyOn(service as any, 'callJudgeAgent').mockResolvedValueOnce({
        ...mockJudgeResponse,
        decision: 'needs_revision',
      });

      // Second call returns approved
      jest
        .spyOn(service as any, 'callJudgeAgent')
        .mockResolvedValueOnce(mockJudgeResponse);

      const result = await (service as any).runCoordinatorWorkflow({
        userIntent: mockAgentMessageDto.message,
        userPreferences: mockAgentMessageDto.preferences,
        cycleCount: 0,
      });

      expect(result.status).toBe('completed');
    });

    it('should handle max cycles reached', async () => {
      // Mock judge to always request revision
      jest.spyOn(service as any, 'callJudgeAgent').mockResolvedValue({
        ...mockJudgeResponse,
        decision: 'needs_revision',
      });

      const result = await (service as any).runCoordinatorWorkflow({
        userIntent: mockAgentMessageDto.message,
        userPreferences: mockAgentMessageDto.preferences,
        cycleCount: 0,
      });

      expect(result.status).toBe('failed');
      expect(result.message).toContain('Maximum revision cycles reached');
    });
  });

  describe('callPlanningAgent', () => {
    it('should call openAI.think and return parsed planning response', async () => {
      const prompt = 'Test planning prompt';

      const result = await (service as any).callPlanningAgent(prompt);

      expect(openAISingleton.think).toHaveBeenCalledWith(prompt);
      expect(result).toEqual(mockPlanningResponse);
    });

    it('should handle errors', async () => {
      const prompt = 'Test planning prompt';
      jest
        .spyOn(openAISingleton, 'think')
        .mockRejectedValueOnce(new Error('API error'));

      await expect((service as any).callPlanningAgent(prompt)).rejects.toThrow(
        'Planning agent failed',
      );
    });
  });

  describe('callResearchAgent', () => {
    it('should call perplexity.research and return parsed research response', async () => {
      const prompt = 'Test research prompt';

      const result = await (service as any).callResearchAgent(prompt);

      expect(perplexitySingleton.research).toHaveBeenCalledWith(prompt);
      expect(result).toEqual(mockResearchResponse);
    });

    it('should handle errors', async () => {
      const prompt = 'Test research prompt';
      jest
        .spyOn(perplexitySingleton, 'research')
        .mockRejectedValueOnce(new Error('API error'));

      await expect((service as any).callResearchAgent(prompt)).rejects.toThrow(
        'Research agent failed',
      );
    });
  });

  describe('callJudgeAgent', () => {
    it('should call openAI.think and return parsed judge response', async () => {
      const prompt = 'Test judge prompt';

      // Mock the OpenAI response specifically for this test
      const mockJudgeJsonResponse = JSON.stringify(mockJudgeResponse);
      jest
        .spyOn(openAISingleton, 'think')
        .mockResolvedValueOnce(mockJudgeJsonResponse);

      const result = await (service as any).callJudgeAgent(prompt);

      expect(openAISingleton.think).toHaveBeenCalledWith(prompt);
      expect(result).toEqual(mockJudgeResponse);
    });

    it('should handle errors', async () => {
      const prompt = 'Test judge prompt';
      jest
        .spyOn(openAISingleton, 'think')
        .mockRejectedValueOnce(new Error('API error'));

      await expect((service as any).callJudgeAgent(prompt)).rejects.toThrow(
        'Judge agent failed',
      );
    });
  });

  describe('parseJsonResponse', () => {
    it('should parse valid JSON response', () => {
      const jsonResponse = '{"key": "value"}';

      const result = (service as any).parseJsonResponse(jsonResponse);

      expect(result).toEqual({ key: 'value' });
    });

    it('should extract JSON from text with surrounding content', () => {
      const response = 'Some text before {"key": "value"} some text after';

      const result = (service as any).parseJsonResponse(response);

      expect(result).toEqual({ key: 'value' });
    });

    it('should throw error when no JSON is found', () => {
      const response = 'No JSON here';

      expect(() => (service as any).parseJsonResponse(response)).toThrow(
        'No JSON found in response',
      );
    });

    it('should throw error when JSON is invalid', () => {
      const response = '{"key": "invalid}'; // Invalid JSON syntax

      expect(() => (service as any).parseJsonResponse(response)).toThrow(
        'Failed to parse agent response',
      );
    });
  });

  describe('buildPlanningPrompt', () => {
    it('should build a planning prompt with user intent', () => {
      const context = {
        userIntent: 'Test intent',
        cycleCount: 0,
      };

      const result = (service as any).buildPlanningPrompt(context);

      expect(result).toContain('Test intent');
    });

    it('should include user preferences when available', () => {
      const context = {
        userIntent: 'Test intent',
        userPreferences: { risk: 'low' },
        cycleCount: 0,
      };

      const result = (service as any).buildPlanningPrompt(context);

      expect(result).toContain('User Preferences');
      expect(result).toContain('risk');
    });

    it('should include judge feedback when available', () => {
      const context = {
        userIntent: 'Test intent',
        judgeResult: {
          decision: 'needs_revision',
          reasoning: 'Test reasoning',
          improvement_suggestions: ['Suggestion 1'],
        },
        cycleCount: 0,
      };

      const result = (service as any).buildPlanningPrompt(context);

      expect(result).toContain('Previous Plan Feedback');
      expect(result).toContain('Test reasoning');
      expect(result).toContain('Suggestion 1');
    });
  });
});
