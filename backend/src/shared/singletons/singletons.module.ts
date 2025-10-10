import { Global, Module } from '@nestjs/common';
import { OpenAISingleton } from './openai.singleton';
import { PerplexitySingleton } from './perplexity.singleton';

@Global()
@Module({
  providers: [OpenAISingleton, PerplexitySingleton],
  exports: [OpenAISingleton, PerplexitySingleton],
})
export class SingletonsModule {}
