import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface Transaction {
  to: string;
  value?: bigint;
  data?: string;
}

@Injectable()
export class WalletService {
  private explorerUrl = 'https://sepolia.basescan.org';
  private walletAddress = '0x1234567890123456789012345678901234567890';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    // Mock implementation
  }

  async getAddress(): Promise<string> {
    return this.walletAddress;
  }

  getExplorerUrl(txHash: string): string {
    return `${this.explorerUrl}/tx/${txHash}`;
  }

  async sendTransaction(transaction: Transaction): Promise<string> {
    return '0xmocktransactionhash';
  }

  async sendBatchTransaction(transactions: Transaction[]): Promise<string> {
    return '0xmockbatchtrxhash';
  }

  async sendSponsoredTransaction(
    transaction: Transaction,
    paymasterUrl: string,
  ): Promise<string> {
    return '0xmocksponsoredtrxhash';
  }

  async getBalance(): Promise<bigint> {
    return BigInt(1000000000000000000); // 1 ETH
  }

  async getUsdcBalance(): Promise<bigint> {
    return BigInt(100500000); // 100.5 USDC with 6 decimals
  }

  async transferEth(to: string, amount: bigint): Promise<string> {
    return '0xmocktransactionhash';
  }

  async transferUsdc(to: string, amount: bigint): Promise<string> {
    return '0xmocktransactionhash';
  }

  // Legacy methods for backward compatibility with tests
  async getWalletAddress(): Promise<string> {
    return this.walletAddress;
  }

  getTransactionUrl(txHash: string): string {
    return this.getExplorerUrl(txHash);
  }

  getWalletUrl(): string {
    return `${this.explorerUrl}/address/${this.walletAddress}`;
  }

  async approveToken(spender: string, amount?: bigint): Promise<string> {
    return '0xmockapprovaltrxhash';
  }

  async batchTransactions(transactions: Transaction[]): Promise<string> {
    return this.sendBatchTransaction(transactions);
  }
}
