import { Module } from '@nestjs/common';
import { NFTController } from './nft.controller';
import { NFTService } from '../agent/services/nft.service';

@Module({
  controllers: [NFTController],
  providers: [NFTService],
})
export class NFTModule {}
