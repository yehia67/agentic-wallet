import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class PerplexitySingleton {
  private readonly openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPEN_ROUTER_API_KEY'),
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://agentic-wallet.com',
        'X-Title': 'Agentic Wallet',
      },
    });
  }

  async research(prompt: string): Promise<string> {
    const provider = this.configService.get<string>(
      'OPEN_ROUTER_RESEARCH_MODEL_PROVIDER',
    );
    const model = this.configService.get<string>(
      'OPEN_ROUTER_RESEARCH_MODEL_NAME',
    );

    const completion = await this.openai.chat.completions.create({
      model: `${provider}/${model}`,
      messages: [{ role: 'user', content: prompt }],
    });

    return completion.choices[0]?.message?.content || '';
  }
}
