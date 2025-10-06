import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createPublicClient,
  createWalletClient,
  getAddress,
  Hex,
  http,
  parseAbiItem,
  encodeFunctionData,
  toHex,
  Chain,
  Account,
  PublicClient,
  WalletClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

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
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'WalletOperationError';
  }
}

@Injectable()
export class WalletService implements OnModuleInit {
  private readonly logger = new Logger(WalletService.name);
  private publicClient!: PublicClient;
  private walletClient!: WalletClient;
  private account!: `0x${string}`;
  private usdcAddress = '';
  private explorerUrl = '';
  
  // Constants
  private static readonly ENTRY_POINT_ADDRESS = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';
  private static readonly BASE_SEPOLIA_RPC = 'https://sepolia.base.org';

  constructor(private readonly configService: ConfigService) {}
  
  /**
   * Initialize the wallet service when the module is initialized
   */
  async onModuleInit(): Promise<void> {
    await this.initialize();
  }

  /**
   * Initialize blockchain clients
   * @param account - The account to use for the wallet client
   */
  private initializeClients(account: Account): void {
    // Initialize public client
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(WalletService.BASE_SEPOLIA_RPC),
    });
    
    // Initialize wallet client
    this.walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(WalletService.BASE_SEPOLIA_RPC),
    });
  }

  /**
   * Create transaction parameters with common values
   * @param to - Recipient address
   * @param value - Transaction value in wei
   * @param data - Transaction data
   * @returns Transaction parameters
   */
  private createTransactionParams(to: string, value: bigint = 0n, data: string = '0x'): any {
    return {
      account: this.walletClient.account,
      chain: baseSepolia,
      to: getAddress(to),
      value,
      data: data as Hex,
    };
  }

  /**
   * Validates and formats a private key
   * @param privateKey - The private key to validate
   * @returns Formatted private key with 0x prefix
   * @throws Error if private key format is invalid
   */
  private validateAndFormatPrivateKey(privateKey?: string): `0x${string}` {
    if (!privateKey) {
      this.logger.error('Private key is missing');
      throw new Error('Private key is missing');
    }
    
    // Always add the 0x prefix since the env variable will never include it
    const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    
    // Validate hex format (should be 0x + 64 hex characters for 32 bytes)
    const hexRegex = /^0x[0-9a-fA-F]{64}$/;
    if (!hexRegex.test(formattedPrivateKey)) {
      this.logger.error('Invalid private key format. Must be a 32-byte hex string.');
      throw new Error('Invalid private key format. Must be a 32-byte hex string.');
    }
    
    return formattedPrivateKey as `0x${string}`;
  }

  /**
   * Initialize the wallet service
   * @returns Promise that resolves when initialization is complete
   */
  private async initialize(): Promise<void> {
    try {
      const privateKey = this.configService.get<string>('PRIVATE_KEY');
      const apiKey = this.configService.get<string>('PIMLICO_API_KEY');
      const usdcAddress = this.configService.get<string>('BASE_SCAN_USDC');
      const explorerUrl = this.configService.get<string>('BASE_SCAN_EXPLORER');

      if (usdcAddress) this.usdcAddress = usdcAddress;
      if (explorerUrl) this.explorerUrl = explorerUrl;

      if (!privateKey || !apiKey) {
        this.logger.error(
          'Missing required environment variables for wallet initialization',
        );
        return;
      }

      // Validate and format the private key
      const formattedPrivateKey = this.validateAndFormatPrivateKey(privateKey);
      
      // Create a simple account from private key
      const account = privateKeyToAccount(formattedPrivateKey as Hex);
      
      // Initialize clients
      this.initializeClients(account);
      
      // Store the account address
      this.account = account.address;
      
      this.logger.log(`Wallet initialized with address: ${this.account}`);
    } catch (error) {
      this.logger.error(
        `Error initializing wallet service: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get the wallet address
   * @returns The wallet address
   * @throws WalletOperationError if wallet is not initialized
   */
  async getWalletAddress(): Promise<`0x${string}`> {
    if (!this.account) {
      throw new WalletOperationError('Wallet not initialized');
    }
    return this.account;
  }

  /**
   * Get the wallet balance in USDC
   * @returns The USDC balance in human-readable format
   * @throws WalletOperationError if wallet is not initialized
   */
  async getUsdcBalance(): Promise<number> {
    if (!this.account || !this.publicClient) {
      throw new WalletOperationError('Wallet not initialized');
    }

    try {
      // Define a properly typed ABI
      const erc20Abi = [
        parseAbiItem(
          'function balanceOf(address account) view returns (uint256)',
        ),
      ] as const;
      const balance = await this.publicClient.readContract({
        abi: erc20Abi,
        address: this.usdcAddress as `0x${string}`,
        functionName: 'balanceOf',
        args: [this.account],
      });

      return Number(balance) / 1_000_000; // Convert from USDC's 6 decimals to human-readable format
    } catch (error) {
      this.logger.error(
        `Error getting USDC balance: ${error.message}`,
        error.stack,
      );
      throw new WalletOperationError(`Failed to get USDC balance`, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Send a transaction with the wallet
   * @param to - Recipient address
   * @param data - Transaction data
   * @returns Transaction hash
   * @throws Error if wallet is not initialized or transaction fails
   */
  async sendTransaction(to: string, data = '0x'): Promise<`0x${string}`> {
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized');
    }

    try {
      const txHash = await this.walletClient.sendTransaction(
        this.createTransactionParams(to, 0n, data)
      );

      this.logger.log(`Transaction sent: ${txHash}`);
      return txHash;
    } catch (error) {
      this.logger.error(
        `Error sending transaction: ${error.message}`,
        error.stack,
      );
      throw new WalletOperationError(`Failed to send transaction`, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Approve a token for spending by a contract
   * @param spender - Address of the contract to approve
   * @param amount - Amount to approve (defaults to maximum uint256 value)
   * @returns Transaction hash
   * @throws Error if wallet is not initialized or approval fails
   */
  async approveToken(
    spender: string,
    amount: bigint = 2n ** 256n - 1n,
  ): Promise<`0x${string}`> {
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized');
    }

    try {
      const txHash = await this.walletClient.writeContract({
        account: this.walletClient.account,
        chain: baseSepolia,
        address: getAddress(this.usdcAddress),
        abi: [
          parseAbiItem('function approve(address spender, uint256 amount)'),
        ],
        functionName: 'approve',
        args: [getAddress(spender), amount],
      });

      this.logger.log(`Token approval transaction sent: ${txHash}`);
      return txHash;
    } catch (error) {
      this.logger.error(`Error approving token: ${error.message}`, error.stack);
      throw new WalletOperationError(`Failed to approve token`, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Execute multiple transactions in a batch
   * @param transactions - Array of transaction objects
   * @returns Hash of the last transaction
   * @throws Error if wallet is not initialized or any transaction fails
   */
  async batchTransactions(
    transactions: Transaction[],
  ): Promise<`0x${string}`> {
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized');
    }

    try {
      if (transactions.length === 0) {
        throw new Error('No transactions provided');
      }

      const txPromises = transactions.map(async (tx) => {
        return this.walletClient.sendTransaction(
          this.createTransactionParams(tx.to, tx.value || 0n, tx.data || '0x')
        );
      });

      const txHashes = await Promise.all(txPromises);
      const lastTxHash = txHashes[txHashes.length - 1];

      this.logger.log(`Batch transactions sent, last hash: ${lastTxHash}`);
      return lastTxHash;
    } catch (error) {
      this.logger.error(
        `Error sending batch transactions: ${error.message}`,
        error.stack,
      );
      throw new WalletOperationError(`Failed to send batch transactions`, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Get transaction URL in block explorer
   * @param txHash - Transaction hash
   * @returns URL to view the transaction in the block explorer
   */
  getTransactionUrl(txHash: string): string {
    return `${this.explorerUrl}/tx/${txHash}`;
  }

  /**
   * Get wallet address URL in block explorer
   * @returns URL to view the wallet in the block explorer
   * @throws WalletOperationError if wallet is not initialized
   */
  getWalletUrl(): string {
    if (!this.account) {
      throw new WalletOperationError('Wallet not initialized');
    }
    return `${this.explorerUrl}/address/${this.account}`;
  }
}
