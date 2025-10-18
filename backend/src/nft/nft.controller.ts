import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { NFTService } from '../agent/services/nft.service';
import { MintNFTDto, MintNFTResponseDto } from '../agent/dto/nft-mint.dto';

@Controller('nft')
export class NFTController {
  private readonly logger = new Logger(NFTController.name);

  constructor(private readonly nftService: NFTService) {}

  /**
   * Mint a new NFT
   */
  @Post('mint')
  async mintNFT(
    @Body() mintDto: MintNFTDto,
  ): Promise<MintNFTResponseDto> {
    this.logger.log('Received mintDto:', JSON.stringify(mintDto, null, 2));
    this.logger.log('mintDto.metadata:', mintDto.metadata);
    this.logger.log('typeof mintDto.metadata:', typeof mintDto.metadata);
    
    // Additional validation check
    if (!mintDto || typeof mintDto !== 'object') {
      return {
        success: false,
        error: 'Invalid request body - expected object',
      };
    }
    
    if (!mintDto.metadata || typeof mintDto.metadata !== 'object') {
      return {
        success: false,
        error: 'Invalid or missing metadata object',
      };
    }

    if (!mintDto.metadata.prompt || typeof mintDto.metadata.prompt !== 'string') {
      return {
        success: false,
        error: 'Prompt field is required and must be a non-empty string',
      };
    }

    try {
      return await this.nftService.mintNFT(mintDto);
    } catch (error) {
      this.logger.error('Failed to mint NFT', error);
      return {
        success: false,
        error: error.message || 'Failed to mint NFT',
      };
    }
  }

  /**
   * Get wallet information for NFT operations
   */
  @Get('wallet-info')
  async getWalletInfo(): Promise<{ address: string; balance: string }> {
    try {
      return await this.nftService.getWalletInfo();
    } catch (error) {
      this.logger.error('Failed to get wallet info', error);
      throw new HttpException(
        'Failed to get wallet info',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get NFT metadata from contract
   */
  @Post('metadata')
  async getNFTMetadata(@Body() body: { tokenId: string }) {
    try {
      if (!body.tokenId) {
        throw new HttpException('Token ID is required', HttpStatus.BAD_REQUEST);
      }

      return await this.nftService.getNFTMetadata(body.tokenId);
    } catch (error) {
      this.logger.error('Failed to get NFT metadata', error);
      throw new HttpException(
        'Failed to get NFT metadata',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
