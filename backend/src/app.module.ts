import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentModule } from './agent/agent.module';
import { WalletModule } from './wallet/wallet.module';
import { NFTModule } from './nft/nft.module';
import { ConfigModule } from './config/config.module';
import { SingletonsModule } from './shared/singletons';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule, // PostgreSQL + pgvector + Redis
    SingletonsModule,
    AgentModule,
    WalletModule,
    NFTModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
