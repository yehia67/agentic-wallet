import { Body, Controller, Post } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentMessageDto, AgentResponseDto } from './dto/agent-message.dto';

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('message')
  async processMessage(
    @Body() messageDto: AgentMessageDto,
  ): Promise<AgentResponseDto> {
    return this.agentService.processMessage(messageDto);
  }
}
