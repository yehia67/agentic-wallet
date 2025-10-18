import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { WalletAgentTool, PlanGeneratorTool } from './tools';
import { WalletModule } from '../shared/services/wallet.module';
import { NFTService } from './services/nft.service';

@Module({
  imports: [WalletModule],
  controllers: [AgentController],
  providers: [AgentService, WalletAgentTool, PlanGeneratorTool, NFTService],
  exports: [AgentService, WalletAgentTool, PlanGeneratorTool, NFTService],
})
export class AgentModule {}
