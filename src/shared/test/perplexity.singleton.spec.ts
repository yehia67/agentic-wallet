import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PerplexitySingleton } from '../singletons/perplexity.singleton';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai', () => {
  const mockOpenAIInstance = {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Mock Perplexity response',
              },
            },
          ],
        }),
      },
    },
  };

  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockOpenAIInstance),
  };
});

// Get the mocked instance for testing
let mockOpenAIInstance: any;
describe('PerplexitySingleton', () => {
  let service: PerplexitySingleton;
  let configService: ConfigService;

  beforeEach(async () => {
    // Reset the mock before each test
    jest.clearAllMocks();
    
    // Get the mock instance for testing
    const OpenAIMock = jest.requireMock('openai').default;
    mockOpenAIInstance = OpenAIMock.mock.results[0]?.value || {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Mock Perplexity response' } }]
          })
        }
      }
    };
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerplexitySingleton,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'OPEN_ROUTER_API_KEY': 'test-api-key',
                'OPEN_ROUTER_RESEARCH_MODEL_PROVIDER': 'perplexity',
                'OPEN_ROUTER_RESEARCH_MODEL_NAME': 'sonar-pro',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PerplexitySingleton>(PerplexitySingleton);
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

  describe('research', () => {
    it('should call OpenAI with correct parameters', async () => {
      const prompt = 'Test research prompt';
      const createSpy = mockOpenAIInstance.chat.completions.create;

      await service.research(prompt);

      expect(configService.get).toHaveBeenCalledWith(
        'OPEN_ROUTER_RESEARCH_MODEL_PROVIDER',
      );
      expect(configService.get).toHaveBeenCalledWith(
        'OPEN_ROUTER_RESEARCH_MODEL_NAME',
      );
      expect(createSpy).toHaveBeenCalledWith({
        model: 'perplexity/sonar-pro',
        messages: [{ role: 'user', content: prompt }],
      });
    });

    it('should return the response content', async () => {
      const result = await service.research('Test research prompt');
      expect(result).toBe('Mock Perplexity response');
    });

    it('should handle empty response', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce({
        choices: [{}],
      });

      const result = await service.research('Test research prompt');
      expect(result).toBe('');
    });

    it('should handle error from OpenAI', async () => {
      mockOpenAIInstance.chat.completions.create.mockRejectedValueOnce(
        new Error('API error'),
      );

      await expect(service.research('Test research prompt')).rejects.toThrow(
        'API error',
      );
    });
  });
});
