import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';

export type AgentMode = 'auto' | 'planning' | 'execution';

export class AgentMessageDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsEnum(['auto', 'planning', 'execution'])
  mode?: AgentMode;

  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;
}

export class AgentResponseDto {
  message: unknown;
  plan?: unknown;
  research?: unknown;
  decision?: unknown;
  wallet?: unknown;
  status: 'in_progress' | 'completed' | 'failed';
  mode?: AgentMode;
  requiresModeSelection?: boolean;
  suggestedMode?: AgentMode;
}
