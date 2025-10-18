import { IsString, IsArray, IsOptional } from 'class-validator';

export class CapabilityDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  category: string;

  @IsArray()
  @IsString({ each: true })
  parameters: string[];

  @IsOptional()
  @IsString()
  endpoint?: string;
}

export class CapabilitiesResponseDto {
  @IsString()
  welcome_message: string;

  @IsArray()
  capabilities: CapabilityDto[];

  @IsString()
  platform_info: string;
}
