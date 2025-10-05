import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OpenAISingleton } from '../singletons/openai.singleton';
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
                content: 'Mock OpenAI response',
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
describe('OpenAISingleton', () => {
  let service: OpenAISingleton;
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
            choices: [{ message: { content: 'Mock OpenAI response' } }]
          })
        }
      }
    };
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAISingleton,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'OPEN_ROUTER_API_KEY': 'test-api-key',
                'OPEN_ROUTER_THINK_MODEL_PROVIDER': 'openai',
                'OPEN_ROUTER_THINK_MODEL_NAME': 'gpt-4o-mini',
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
      const createSpy = mockOpenAIInstance.chat.completions.create;

      await service.think(prompt);

      expect(configService.get).toHaveBeenCalledWith(
        'OPEN_ROUTER_THINK_MODEL_PROVIDER',
      );
      expect(configService.get).toHaveBeenCalledWith(
        'OPEN_ROUTER_THINK_MODEL_NAME',
      );
      expect(createSpy).toHaveBeenCalledWith({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });
    });

    it('should return the response content', async () => {
      const result = await service.think('Test prompt');
      expect(result).toBe('Mock OpenAI response');
    });

    it('should handle empty response', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce({
        choices: [{}],
      });

      const result = await service.think('Test prompt');
      expect(result).toBe('');
    });

    it('should handle error from OpenAI', async () => {
      mockOpenAIInstance.chat.completions.create.mockRejectedValueOnce(
        new Error('API error'),
      );

      await expect(service.think('Test prompt')).rejects.toThrow('API error');
    });
  });
});
