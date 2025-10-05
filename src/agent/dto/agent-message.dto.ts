import { IsString, IsOptional, IsObject } from 'class-validator';

export class AgentMessageDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;
}

export class AgentResponseDto {
  message: unknown;
  plan?: unknown;
  research?: unknown;
  decision?: unknown;
  status: 'in_progress' | 'completed' | 'failed';
}
