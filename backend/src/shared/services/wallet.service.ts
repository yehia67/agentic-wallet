import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PublicClient,
  createPublicClient,
  http,
  getAddress,
  encodeFunctionData,
  numberToHex,
} from 'viem';
import { baseSepolia, base } from 'viem/chains';

/**
 * Transaction data interface
 */
interface Transaction {
  to: string;
  value?: bigint;
  data?: string;
}

/**
 * Custom error for wallet operations
 */
class WalletOperationError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'WalletOperationError';
  }
}

/**
 * Base Account SDK types (for TypeScript support)
 */
interface TransactionCall {
  to: string;
  value: string;
  data: string;
}

interface BatchTransactionParams {
  version: string;
  from: string;
  chainId: string;
  calls: TransactionCall[];
  atomicRequired?: boolean;
  capabilities?: {
    paymasterService?: {
      url: string;
    };
  };
}

@Injectable()
export class WalletService implements OnModuleInit {
  private readonly logger = new Logger(WalletService.name);
  private publicClient!: PublicClient;
  private sdk: any; // BaseAccountSDK
  private provider: any;
  private userAddress = '';
  private usdcAddress = '';
  private explorerUrl = '';
  private rpcUrl = '';

  // Constants
  private static readonly SMART_WALLET_FACTORY =
    '0x0BA5ED0c6AA8c49038F819E587E2633c4A9F428a';
  private static readonly DEFAULT_BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
  private static readonly BASE_CHAIN_ID = base.id;
  private static readonly BASE_SEPOLIA_CHAIN_ID = baseSepolia.id;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize the wallet service when the module is initialized
   */
  async onModuleInit(): Promise<void> {
    await this.initialize();
  }

  /**
   * Initialize blockchain clients
   */
  private initializeClients(): void {
    try {
      // Initialize public client for blockchain data access
      const rpcUrl = this.rpcUrl || WalletService.DEFAULT_BASE_SEPOLIA_RPC;
      this.logger.log(`Initializing client with RPC: ${rpcUrl}`);

      this.publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(rpcUrl),
      });

      // Initialize Base Account SDK
      // Note: In a real implementation, this would be properly initialized
      // with the actual SDK. This is a placeholder for the structure.
      this.sdk = {
        getProvider: () => {
          return {
            request: async ({ method, params }) => {
              this.logger.debug(`Provider request: ${method}`);
              // This would be implemented with the actual SDK
              return { hash: '0x' + '0'.repeat(64) }; // Placeholder
            },
          };
        },
      };

      this.provider = this.sdk.getProvider();
    } catch (error) {
      this.logger.error('Failed to initialize clients', error);
      throw new WalletOperationError(
        'Failed to initialize wallet clients',
        error as Error,
      );
    }
  }

  /**
   * Create transaction parameters with common values
   * @param to - Recipient address
   * @param value - Transaction value in wei
   * @param data - Transaction data
   * @returns Transaction call object
   */
  private createTransactionParams(
    to: string,
    value = 0n,
    data = '0x',
  ): TransactionCall {
    return {
      to: getAddress(to),
      value: numberToHex(value),
      data: data as string,
    };
  }

  /**
   * Initialize the wallet service
   * @returns Promise that resolves when initialization is complete
   */
  private async initialize(): Promise<void> {
    try {
      const usdcAddress = this.configService.get<string>('BASE_SCAN_USDC');
      const explorerUrl = this.configService.get<string>('BASE_SCAN_EXPLORER');
      const rpcUrl = this.configService.get<string>('BASE_SEPOLIA_RPC');

      if (usdcAddress) this.usdcAddress = usdcAddress;
      if (explorerUrl) this.explorerUrl = explorerUrl;
      if (rpcUrl) {
        this.rpcUrl = rpcUrl;
        this.logger.log(`Using RPC URL from environment: ${rpcUrl}`);
      } else {
        this.logger.warn(
          'BASE_SEPOLIA_RPC not found in environment, using default',
        );
      }

      this.initializeClients();

      this.logger.log('Wallet service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize wallet service', error);
      throw new WalletOperationError(
        'Failed to initialize wallet service',
        error as Error,
      );
    }
  }

  /**
   * Get the wallet address
   * @returns The wallet address
   */
  async getAddress(): Promise<string> {
    try {
      if (!this.userAddress) {
        // In a real implementation, this would use the SDK to get the user's address
        this.userAddress = '0x10b6D4Ec3CA3C374aa4B5673863305ebE4c4d9c1'; // Placeholder
      }
      return this.userAddress;
    } catch (error) {
      this.logger.error('Failed to get address', error);
      throw new WalletOperationError('Failed to get address', error as Error);
    }
  }

  /**
   * Get the explorer URL for a transaction
   * @param txHash - Transaction hash
   * @returns Explorer URL for the transaction
   */
  getExplorerUrl(txHash: string): string {
    return `${this.explorerUrl}/tx/${txHash}`;
  }

  /**
   * Send a transaction using Base Account
   * @param transaction - Transaction data
   * @returns Transaction hash
   */
  async sendTransaction(transaction: Transaction): Promise<string> {
    try {
      const { to, value = 0n, data = '0x' } = transaction;

      const txParams = this.createTransactionParams(to, value, data);

      // Get the user's address
      const fromAddress = await this.getAddress();

      // Create transaction parameters for Base Account
      const params: BatchTransactionParams = {
        version: '1.0',
        from: fromAddress,
        chainId: numberToHex(WalletService.BASE_SEPOLIA_CHAIN_ID),
        calls: [txParams],
      };

      // Send the transaction
      const result = await this.provider.request({
        method: 'wallet_sendCalls',
        params: [params],
      });

      this.logger.log(`Transaction sent: ${result.hash}`);
      return result.hash;
    } catch (error) {
      this.logger.error('Failed to send transaction', error);
      throw new WalletOperationError(
        'Failed to send transaction',
        error as Error,
      );
    }
  }

  /**
   * Send a batch transaction using Base Account
   * @param transactions - Array of transactions to batch
   * @returns Transaction hash
   */
  async sendBatchTransaction(transactions: Transaction[]): Promise<string> {
    try {
      // Get the user's address
      const fromAddress = await this.getAddress();

      // Create transaction calls
      const calls = transactions.map((tx) => {
        const { to, value = 0n, data = '0x' } = tx;
        return this.createTransactionParams(to, value, data);
      });

      // Create batch transaction parameters
      const params: BatchTransactionParams = {
        version: '2.0.0',
        from: fromAddress,
        chainId: numberToHex(WalletService.BASE_SEPOLIA_CHAIN_ID),
        atomicRequired: true, // All calls must succeed or all fail
        calls,
      };

      // Send the batch transaction
      const result = await this.provider.request({
        method: 'wallet_sendCalls',
        params: [params],
      });

      this.logger.log(`Batch transaction sent: ${result.hash}`);
      return result.hash;
    } catch (error) {
      this.logger.error('Failed to send batch transaction', error);
      throw new WalletOperationError(
        'Failed to send batch transaction',
        error as Error,
      );
    }
  }

  /**
   * Send a sponsored transaction using a paymaster
   * @param transaction - Transaction data
   * @param paymasterUrl - URL of the paymaster service
   * @returns Transaction hash
   */
  async sendSponsoredTransaction(
    transaction: Transaction,
    paymasterUrl: string,
  ): Promise<string> {
    try {
      const { to, value = 0n, data = '0x' } = transaction;

      const txParams = this.createTransactionParams(to, value, data);

      // Get the user's address
      const fromAddress = await this.getAddress();

      // Create transaction parameters with paymaster capability
      const params: BatchTransactionParams = {
        version: '1.0',
        from: fromAddress,
        chainId: numberToHex(WalletService.BASE_SEPOLIA_CHAIN_ID),
        calls: [txParams],
        capabilities: {
          paymasterService: {
            url: paymasterUrl,
          },
        },
      };

      // Send the transaction with paymaster
      const result = await this.provider.request({
        method: 'wallet_sendCalls',
        params: [params],
      });

      this.logger.log(`Sponsored transaction sent: ${result.hash}`);
      return result.hash;
    } catch (error) {
      this.logger.error('Failed to send sponsored transaction', error);
      throw new WalletOperationError(
        'Failed to send sponsored transaction',
        error as Error,
      );
    }
  }

  /**
   * Get the balance of the wallet
   * @returns Balance in wei
   */
  async getBalance(): Promise<bigint> {
    try {
      const address = await this.getAddress();
      return await this.publicClient.getBalance({
        address: address as `0x${string}`,
      });
    } catch (error) {
      this.logger.error('Failed to get balance', error);
      throw new WalletOperationError('Failed to get balance', error as Error);
    }
  }

  /**
   * Get the ETH balance of any address
   * @param address - The address to check balance for
   * @returns Balance in wei
   */
  async getBalanceForAddress(address: string): Promise<bigint> {
    try {
      this.logger.log(`Checking ETH balance for address: ${address}`);
      return await this.publicClient.getBalance({
        address: address as `0x${string}`,
      });
    } catch (error) {
      this.logger.error(`Failed to get balance for address ${address}`, error);
      throw new WalletOperationError(
        `Failed to get balance for address ${address}`,
        error as Error,
      );
    }
  }

  /**
   * Get the USDC balance of the wallet
   * @returns USDC balance in smallest unit
   */
  async getUsdcBalance(): Promise<bigint> {
    try {
      if (!this.usdcAddress) {
        throw new Error('USDC address not configured');
      }

      const address = await this.getAddress();

      const balance = await this.publicClient.readContract({
        address: this.usdcAddress as `0x${string}`,
        abi: [
          {
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }],
          },
        ],
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      });

      return balance as bigint;
    } catch (error) {
      this.logger.error('Failed to get USDC balance', error);
      throw new WalletOperationError(
        'Failed to get USDC balance',
        error as Error,
      );
    }
  }

  /**
   * Get the USDC balance of any address
   * @param address - The address to check USDC balance for
   * @returns USDC balance in smallest unit (6 decimals)
   */
  async getUsdcBalanceForAddress(address: string): Promise<bigint> {
    try {
      if (!this.usdcAddress) {
        throw new Error('USDC address not configured');
      }

      this.logger.log(`Checking USDC balance for address: ${address}`);

      const balance = await this.publicClient.readContract({
        address: this.usdcAddress as `0x${string}`,
        abi: [
          {
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }],
          },
        ],
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      });

      return balance as bigint;
    } catch (error) {
      this.logger.error(
        `Failed to get USDC balance for address ${address}`,
        error,
      );
      throw new WalletOperationError(
        `Failed to get USDC balance for address ${address}`,
        error as Error,
      );
    }
  }

  /**
   * Transfer ETH to a recipient
   * @param to - Recipient address
   * @param amount - Amount in wei
   * @returns Transaction hash
   */
  async transferEth(to: string, amount: bigint): Promise<string> {
    try {
      return await this.sendTransaction({ to, value: amount });
    } catch (error) {
      this.logger.error('Failed to transfer ETH', error);
      throw new WalletOperationError('Failed to transfer ETH', error as Error);
    }
  }

  /**
   * Transfer USDC to a recipient
   * @param to - Recipient address
   * @param amount - Amount in smallest USDC unit
   * @returns Transaction hash
   */
  async transferUsdc(to: string, amount: bigint): Promise<string> {
    try {
      if (!this.usdcAddress) {
        throw new Error('USDC address not configured');
      }

      const data = encodeFunctionData({
        abi: [
          {
            name: 'transfer',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
            outputs: [{ name: '', type: 'bool' }],
          },
        ],
        functionName: 'transfer',
        args: [to as `0x${string}`, amount],
      });

      return await this.sendTransaction({
        to: this.usdcAddress,
        data,
      });
    } catch (error) {
      this.logger.error('Failed to transfer USDC', error);
      throw new WalletOperationError('Failed to transfer USDC', error as Error);
    }
  }
}
