import { Test, TestingModule } from '@nestjs/testing';
import { AgentController } from '../agent.controller';
import { AgentService } from '../agent.service';
import { mockAgentMessageDto, mockAgentResponseDto } from './mocks/agent.mocks';

describe('AgentController', () => {
  let controller: AgentController;
  let service: AgentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentController],
      providers: [
        {
          provide: AgentService,
          useValue: {
            processMessage: jest.fn().mockResolvedValue(mockAgentResponseDto),
          },
        },
      ],
    }).compile();

    controller = module.get<AgentController>(AgentController);
    service = module.get<AgentService>(AgentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('processMessage', () => {
    it('should call service.processMessage with the provided dto', async () => {
      const result = await controller.processMessage(mockAgentMessageDto);

      expect(service.processMessage).toHaveBeenCalledWith(mockAgentMessageDto);
      expect(result).toEqual(mockAgentResponseDto);
    });

    it('should return the response from the service', async () => {
      const result = await controller.processMessage(mockAgentMessageDto);

      expect(result).toEqual(mockAgentResponseDto);
    });

    it('should handle errors from the service', async () => {
      const errorMessage = 'Test error';
      jest
        .spyOn(service, 'processMessage')
        .mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        controller.processMessage(mockAgentMessageDto),
      ).rejects.toThrow(errorMessage);
    });
  });
});
