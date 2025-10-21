import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Agentic Wallet API - Health Check OK';
  }
}
