import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentModule } from './agent/agent.module';
import { ConfigModule } from './config/config.module';
import { SingletonsModule } from './shared/singletons';

@Module({
  imports: [ConfigModule, SingletonsModule, AgentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
