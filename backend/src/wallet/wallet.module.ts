import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletModule as WalletServiceModule } from '../shared/services/wallet.module';

@Module({
  imports: [WalletServiceModule],
  controllers: [WalletController],
})
export class WalletModule {}
