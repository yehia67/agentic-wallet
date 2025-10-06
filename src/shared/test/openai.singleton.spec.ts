import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OpenAISingleton } from '../singletons/openai.singleton';
import OpenAI from 'openai';

// Create a mock for OpenAI
const mockCreate = jest.fn();
const mockOpenAI = {
  chat: {
    completions: {
      create: mockCreate
    }
  }
};

// Mock the OpenAI constructor
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn(() => mockOpenAI)
  };
});

describe('OpenAISingleton', () => {
  let service: OpenAISingleton;
  let configService: ConfigService;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Default mock implementation for successful responses
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: 'Mock OpenAI response'
        }
      }]
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAISingleton,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                OPEN_ROUTER_API_KEY: 'test-api-key',
                OPEN_ROUTER_THINK_MODEL_PROVIDER: 'openai',
                OPEN_ROUTER_THINK_MODEL_NAME: 'gpt-4o-mini',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<OpenAISingleton>(OpenAISingleton);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize OpenAI client with correct config', () => {
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://agentic-wallet.com',
          'X-Title': 'Agentic Wallet',
        },
      });
    });
  });

  describe('think', () => {
    it('should call OpenAI with correct parameters', async () => {
      const prompt = 'Test prompt';
      
      await service.think(prompt);

      expect(configService.get).toHaveBeenCalledWith(
        'OPEN_ROUTER_THINK_MODEL_PROVIDER',
      );
      expect(configService.get).toHaveBeenCalledWith(
        'OPEN_ROUTER_THINK_MODEL_NAME',
      );
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });
    });

    it('should return the response content', async () => {
      const result = await service.think('Test prompt');
      expect(result).toBe('Mock OpenAI response');
    });

    it('should handle empty response', async () => {
      // Mock empty response for this test only
      mockCreate.mockResolvedValueOnce({
        choices: [{}],
      });

      const result = await service.think('Test prompt');
      expect(result).toBe('');
    });

    it('should handle error from OpenAI', async () => {
      // Mock rejection for this test only
      mockCreate.mockRejectedValueOnce(new Error('API error'));

      await expect(service.think('Test prompt')).rejects.toThrow('API error');
    });
  });
});
