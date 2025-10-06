import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private address = '0x1234567890123456789012345678901234567890';

  async getWalletAddress(): Promise<string> {
    return this.address;
  }

  async getUsdcBalance(): Promise<number> {
    return 100.5;
  }

  getWalletUrl(): string {
    return `https://sepolia.basescan.org/address/${this.address}`;
  }

  async sendTransaction(to: string, data = '0x'): Promise<string> {
    this.logger.log(`Mock sending transaction to ${to}`);
    return '0xmocktransactionhash';
  }

  async approveToken(
    spender: string,
    amount = BigInt(
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    ),
  ): Promise<string> {
    this.logger.log(`Mock approving token for ${spender}`);
    return '0xmockapprovaltrxhash';
  }

  async batchTransactions(
    transactions: Array<{ to: string; value?: bigint; data?: string }>,
  ): Promise<string> {
    this.logger.log(
      `Mock batch transactions: ${transactions.length} transactions`,
    );
    return '0xmockbatchtrxhash';
  }

  getTransactionUrl(txHash: string): string {
    return `https://sepolia.basescan.org/tx/${txHash}`;
  }
}
