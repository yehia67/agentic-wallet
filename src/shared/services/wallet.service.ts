import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createSmartAccountClient } from 'permissionless';
import { toSafeSmartAccount } from 'permissionless/accounts';
import { createPimlicoClient } from 'permissionless/clients/pimlico';
import {
  createPublicClient,
  getAddress,
  Hex,
  http,
  parseAbiItem,
  encodeFunctionData,
} from 'viem';
import {
  entryPoint07Address,
  EntryPointVersion,
} from 'viem/account-abstraction';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private publicClient: any;
  private pimlicoClient: any;
  private account: any;
  private smartAccountClient: any;
  private usdcAddress: string = '';
  private explorerUrl: string = '';

  constructor(private readonly configService: ConfigService) {
    this.initialize();
  }

  private async initialize() {
    try {
      const privateKey = this.configService.get<string>('PRIVATE_KEY');
      const apiKey = this.configService.get<string>('PIMLICO_API_KEY');
      const pimlicoRpc = this.configService.get<string>('PIMLICO_RPC');
      const usdcAddress = this.configService.get<string>('BASE_SCAN_USDC');
      const explorerUrl = this.configService.get<string>('BASE_SCAN_EXPLORER');
      
      if (usdcAddress) this.usdcAddress = usdcAddress;
      if (explorerUrl) this.explorerUrl = explorerUrl;

      if (!privateKey || !apiKey || !pimlicoRpc) {
        this.logger.error(
          'Missing required environment variables for wallet initialization',
        );
        return;
      }

      // Initialize public client
      this.publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http('https://sepolia.base.org'),
      });

      // Initialize Pimlico client
      const pimlicoUrl = `https://api.pimlico.io/v2/${baseSepolia.id}/rpc?apikey=${apiKey}`;
      this.pimlicoClient = createPimlicoClient({
        chain: baseSepolia,
        transport: http(pimlicoUrl),
        entryPoint: {
          address: entryPoint07Address,
          version: '0.7' as EntryPointVersion,
        },
      });

      // Create Safe smart account
      this.account = await toSafeSmartAccount({
        client: this.publicClient,
        owners: [privateKeyToAccount(privateKey as Hex)],
        version: '1.4.1',
      });

      // Create smart account client
      this.smartAccountClient = createSmartAccountClient({
        account: this.account,
        chain: baseSepolia,
        bundlerTransport: http(pimlicoUrl),
        paymaster: this.pimlicoClient,
        userOperation: {
          estimateFeesPerGas: async () => {
            return (await this.pimlicoClient.getUserOperationGasPrice()).fast;
          },
        },
      });

      this.logger.log(`Smart account initialized: ${this.account.address}`);
    } catch (error) {
      this.logger.error(
        `Error initializing wallet service: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get the wallet address
   */
  async getWalletAddress(): Promise<string> {
    if (!this.account) {
      throw new Error('Wallet not initialized');
    }
    return this.account.address;
  }

  /**
   * Get the wallet balance in USDC
   */
  async getUsdcBalance(): Promise<number> {
    if (!this.account || !this.publicClient) {
      throw new Error('Wallet not initialized');
    }

    try {
      const balance = await this.publicClient.readContract({
        abi: [parseAbiItem('function balanceOf(address account) returns (uint256)')],
        address: this.usdcAddress as `0x${string}`,
        functionName: 'balanceOf',
        args: [this.account.address],
      });

      return Number(balance) / 1_000_000; // Convert from USDC's 6 decimals to human-readable format
    } catch (error) {
      this.logger.error(
        `Error getting USDC balance: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to get USDC balance: ${error.message}`);
    }
  }

  /**
   * Send a transaction with the smart account
   */
  async sendTransaction(to: string, data = '0x'): Promise<string> {
    if (!this.smartAccountClient) {
      throw new Error('Smart account client not initialized');
    }

    try {
      const txHash = await this.smartAccountClient.sendTransaction({
        to: getAddress(to),
        value: 0n,
        data: data as Hex,
      });

      this.logger.log(`Transaction sent: ${txHash}`);
      return txHash;
    } catch (error) {
      this.logger.error(
        `Error sending transaction: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to send transaction: ${error.message}`);
    }
  }

  /**
   * Approve a token for spending by a contract
   */
  async approveToken(
    spender: string,
    amount: bigint = 2n ** 256n - 1n,
  ): Promise<string> {
    if (!this.smartAccountClient) {
      throw new Error('Smart account client not initialized');
    }

    try {
      const txHash = await this.smartAccountClient.sendTransaction({
        to: getAddress(this.usdcAddress),
        value: 0n,
        data: encodeFunctionData({
          abi: [parseAbiItem('function approve(address spender, uint256 amount)')],
          functionName: 'approve',
          args: [getAddress(spender), amount]
        }),
      });

      this.logger.log(`Token approval transaction sent: ${txHash}`);
      return txHash;
    } catch (error) {
      this.logger.error(`Error approving token: ${error.message}`, error.stack);
      throw new Error(`Failed to approve token: ${error.message}`);
    }
  }

  /**
   * Execute multiple transactions in a batch
   */
  async batchTransactions(
    transactions: Array<{ to: string; value?: bigint; data?: string }>,
  ): Promise<string> {
    if (!this.smartAccountClient) {
      throw new Error('Smart account client not initialized');
    }

    try {
      const formattedCalls = transactions.map((tx) => ({
        to: getAddress(tx.to),
        value: tx.value || 0n,
        data: (tx.data || '0x') as Hex,
      }));

      const txHash = await this.smartAccountClient.sendTransaction({
        calls: formattedCalls,
      });

      this.logger.log(`Batch transaction sent: ${txHash}`);
      return txHash;
    } catch (error) {
      this.logger.error(
        `Error sending batch transactions: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to send batch transactions: ${error.message}`);
    }
  }

  /**
   * Get transaction URL in block explorer
   */
  getTransactionUrl(txHash: string): string {
    return `${this.explorerUrl}/tx/${txHash}`;
  }

  /**
   * Get wallet address URL in block explorer
   */
  getWalletUrl(): string {
    if (!this.account) {
      throw new Error('Wallet not initialized');
    }
    return `${this.explorerUrl}/address/${this.account.address}`;
  }
}
