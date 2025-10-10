import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { WalletAgentTool, PlanGeneratorTool } from './tools';
import { WalletModule } from '../shared/services/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [AgentController],
  providers: [AgentService, WalletAgentTool, PlanGeneratorTool],
  exports: [AgentService, WalletAgentTool, PlanGeneratorTool],
})
export class AgentModule {}
