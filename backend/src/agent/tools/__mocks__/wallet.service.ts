import { Injectable } from '@nestjs/common';

@Injectable()
export class WalletService {
  async getWalletAddress(): Promise<string> {
    return '0x1234567890123456789012345678901234567890';
  }

  async getUsdcBalance(): Promise<number> {
    return 100.5;
  }

  getWalletUrl(): string {
    return 'https://sepolia.basescan.org/address/0x1234567890123456789012345678901234567890';
  }

  async sendTransaction(to: string, data = '0x'): Promise<string> {
    return '0xmocktransactionhash';
  }

  async approveToken(spender: string, amount = BigInt(0)): Promise<string> {
    return '0xmockapprovaltrxhash';
  }

  async batchTransactions(
    transactions: Array<{ to: string; value?: bigint; data?: string }>,
  ): Promise<string> {
    return '0xmockbatchtrxhash';
  }

  getTransactionUrl(txHash: string): string {
    return `https://sepolia.basescan.org/tx/${txHash}`;
  }
}
