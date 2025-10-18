import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class NFTMetadataDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  prompt: string; // The actual AI prompt text

  @IsString()
  category: string;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsNumber()
  @Min(1)
  @Max(10)
  complexity: number;

  @IsBoolean()
  isPublic: boolean;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  external_url?: string;
}

export class MintNFTDto {
  @IsString()
  to: string;

  @ValidateNested()
  @Type(() => NFTMetadataDto)
  metadata: NFTMetadataDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  royaltyPercentage?: number = 250; // 2.5% default

  @IsOptional()
  @IsString()
  subscriptionPrice?: string = '0'; // Default free
}

export class MintNFTResponseDto {
  @IsBoolean()
  success: boolean;

  @IsOptional()
  @IsString()
  transactionHash?: string;

  @IsOptional()
  @IsNumber()
  tokenId?: number; // May be undefined if log parsing fails

  @IsOptional()
  @IsString()
  explorerUrl?: string;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
