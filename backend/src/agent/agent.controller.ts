import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentMessageDto, AgentResponseDto } from './dto/agent-message.dto';
import { CapabilitiesResponseDto } from './dto/capabilities.dto';

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('message')
  async processMessage(
    @Body() messageDto: AgentMessageDto,
  ): Promise<AgentResponseDto> {
    return this.agentService.processMessage(messageDto);
  }

  @Post('message/async')
  async startAsyncMessage(
    @Body() messageDto: AgentMessageDto,
  ): Promise<{ jobId: string }> {
    return this.agentService.startAsyncJob(messageDto);
  }

  @Get('job/:jobId')
  async getJobStatus(@Param('jobId') jobId: string): Promise<any> {
    const job = this.agentService.getJobStatus(jobId);
    
    if (!job) {
      return {
        status: 'not_found',
        message: 'Job not found or expired',
      };
    }

    return job;
  }

  @Get('capabilities')
  async getCapabilities(): Promise<CapabilitiesResponseDto> {
    return this.agentService.getCapabilities();
  }

  @Get('query')
  async queryAgent(): Promise<AgentResponseDto> {
    // Return welcome message and capabilities for GET requests
    const capabilities = await this.agentService.getCapabilities();
    return {
      message: capabilities.welcome_message,
      plan: capabilities,
      status: 'completed',
    };
  }

  @Post('research')
  async research(
    @Body() body: { query: string; context?: string },
  ): Promise<any> {
    // Direct research endpoint
    const message = `Research: ${body.query}${body.context ? ` Context: ${body.context}` : ''}`;
    return this.agentService.processMessage({ message });
  }

  @Post('judge')
  async judge(
    @Body() body: { plan: any; researchFindings: any },
  ): Promise<any> {
    // Direct judge endpoint
    const message = `Evaluate this plan: ${JSON.stringify(body.plan)} with research: ${JSON.stringify(body.researchFindings)}`;
    return this.agentService.processMessage({ message });
  }
}
