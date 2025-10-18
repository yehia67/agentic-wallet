import { Injectable, Logger } from '@nestjs/common';
import { WalletService } from '../../shared/services/wallet.service';
import { OpenAISingleton } from '../../shared/singletons';

export interface WalletAgentRequest {
  action:
    | 'check_balance'
    | 'send_transaction'
    | 'approve_token'
    | 'batch_transactions';
  parameters?: {
    to?: string;
    data?: string;
    spender?: string;
    transactions?: Array<{ to: string; value?: string; data?: string }>;
  };
}

export interface WalletAgentResponse {
  success: boolean;
  message: string;
  data?: {
    address?: string;
    balance?: number; // Kept for backward compatibility (ETH balance)
    ethBalance?: number;
    usdcBalance?: number;
    transactionHash?: string;
    explorerUrl?: string;
  };
  error?: string;
}

@Injectable()
export class WalletAgentTool {
  private readonly logger = new Logger(WalletAgentTool.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly openAI: OpenAISingleton,
  ) {}

  /**
   * Execute wallet operations based on the request
   */
  async execute(request: WalletAgentRequest): Promise<WalletAgentResponse> {
    try {
      this.logger.log(`Executing wallet agent request: ${request.action}`);

      switch (request.action) {
        case 'check_balance':
          return await this.checkBalance(request.parameters?.to);
        case 'send_transaction':
          return await this.sendTransaction(request);
        case 'approve_token':
          return await this.approveToken(request);
        case 'batch_transactions':
          return await this.batchTransactions(request);
        default:
          return {
            success: false,
            message: 'Invalid wallet action',
            error: `Action ${request.action} not supported`,
          };
      }
    } catch (error) {
      this.logger.error(`Error in wallet agent: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Wallet operation failed',
        error: error.message,
      };
    }
  }

  /**
   * Check wallet balance
   * @param targetAddress - Optional address to check balance for. If not provided, checks user's wallet
   */
  private async checkBalance(targetAddress?: string): Promise<WalletAgentResponse> {
    try {
      let address: string;
      let ethBalance: bigint;
      let usdcBalance: bigint;
      
      if (targetAddress) {
        // Check balance for specific address
        address = targetAddress;
        ethBalance = await this.walletService.getBalanceForAddress(address);
        usdcBalance = await this.walletService.getUsdcBalanceForAddress(address);
      } else {
        // Check user's own wallet balance
        address = await this.walletService.getAddress();
        ethBalance = await this.walletService.getBalance();
        usdcBalance = await this.walletService.getUsdcBalance();
      }
      
      const explorerUrl = `${this.walletService.getExplorerUrl(
        '',
      )}address/${address}`;
      
      // Convert from wei to ETH (18 decimals) and USDC smallest unit to USDC (6 decimals)
      const ethBalanceFormatted = Number(ethBalance) / 1e18;
      const usdcBalanceFormatted = Number(usdcBalance) / 1e6;

      return {
        success: true,
        message: targetAddress 
          ? `Balance retrieved for address ${address}` 
          : `Wallet balance retrieved successfully`,
        data: {
          address,
          balance: ethBalanceFormatted, // Keep for backward compatibility
          ethBalance: ethBalanceFormatted,
          usdcBalance: usdcBalanceFormatted,
          explorerUrl,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: targetAddress 
          ? `Failed to check balance for address ${targetAddress}` 
          : 'Failed to check wallet balance',
        error: error.message,
      };
    }
  }

  /**
   * Send a transaction
   */
  private async sendTransaction(
    request: WalletAgentRequest,
  ): Promise<WalletAgentResponse> {
    if (!request.parameters?.to) {
      return {
        success: false,
        message: 'Missing required parameters',
        error: 'Recipient address (to) is required',
      };
    }

    try {
      const txHash = await this.walletService.sendTransaction({
        to: request.parameters.to,
        data: request.parameters.data || '0x',
      });
      const explorerUrl = this.walletService.getExplorerUrl(txHash);

      return {
        success: true,
        message: 'Transaction sent successfully',
        data: {
          transactionHash: txHash,
          explorerUrl,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send transaction',
        error: error.message,
      };
    }
  }

  /**
   * Approve token for spending
   */
  private async approveToken(
    request: WalletAgentRequest,
  ): Promise<WalletAgentResponse> {
    if (!request.parameters?.spender) {
      return {
        success: false,
        message: 'Missing required parameters',
        error: 'Spender address is required',
      };
    }

    try {
      // Create approve token transaction data
      const approveData = {
        to: this.walletService['usdcAddress'], // Access the USDC address from wallet service
        data: '', // This will be filled by the encodeFunctionData for the approve function
      };

      // Encode the approve function data
      const data = await this.encodeApproveFunction(request.parameters.spender);
      approveData.data = data;

      // Send the transaction
      const txHash = await this.walletService.sendTransaction(approveData);
      const explorerUrl = this.walletService.getExplorerUrl(txHash);

      return {
        success: true,
        message: 'Token approval transaction sent successfully',
        data: {
          transactionHash: txHash,
          explorerUrl,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to approve token',
        error: error.message,
      };
    }
  }
  /**
   * Helper method to encode approve function data
   */
  private async encodeApproveFunction(spender: string): Promise<string> {
    // Import encodeFunctionData from viem
    const { encodeFunctionData } = await import('viem');

    // Encode the approve function call
    return encodeFunctionData({
      abi: [
        {
          name: 'approve',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
        },
      ],
      functionName: 'approve',
      args: [
        spender as `0x${string}`,
        BigInt(
          '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        ),
      ],
    });
  }

  /**
   * Execute batch transactions
   */
  private async batchTransactions(
    request: WalletAgentRequest,
  ): Promise<WalletAgentResponse> {
    if (
      !request.parameters?.transactions ||
      !Array.isArray(request.parameters.transactions) ||
      request.parameters.transactions.length === 0
    ) {
      return {
        success: false,
        message: 'Missing required parameters',
        error: 'Valid transactions array is required',
      };
    }

    try {
      // Convert string values to BigInt
      const formattedTransactions = request.parameters.transactions.map(
        (tx) => ({
          to: tx.to,
          value: tx.value ? BigInt(tx.value) : BigInt(0),
          data: tx.data || '0x',
        }),
      );

      const txHash = await this.walletService.sendBatchTransaction(
        formattedTransactions,
      );
      const explorerUrl = this.walletService.getExplorerUrl(txHash);

      return {
        success: true,
        message: 'Batch transactions sent successfully',
        data: {
          transactionHash: txHash,
          explorerUrl,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to execute batch transactions',
        error: error.message,
      };
    }
  }

  /**
   * Analyze a transaction request for safety
   */
  async analyzeTransactionSafety(
    request: WalletAgentRequest,
  ): Promise<{ safe: boolean; reason: string }> {
    try {
      // Use LLM to analyze transaction safety
      const prompt = this.buildSafetyAnalysisPrompt(request);
      const analysis = await this.openAI.think(prompt);

      // Parse the analysis
      const safetyResult = this.parseSafetyAnalysis(analysis);
      return safetyResult;
    } catch (error) {
      this.logger.error(
        `Error analyzing transaction safety: ${error.message}`,
        error.stack,
      );
      return {
        safe: false,
        reason: `Safety analysis failed: ${error.message}`,
      };
    }
  }

  /**
   * Build prompt for safety analysis
   */
  private buildSafetyAnalysisPrompt(request: WalletAgentRequest): string {
    let prompt = `Analyze the following wallet transaction for safety and security risks:\n\n`;
    prompt += `Action: ${request.action}\n`;

    if (request.parameters) {
      prompt += `Parameters: ${JSON.stringify(
        request.parameters,
        null,
        2,
      )}\n\n`;
    }

    prompt += `Consider the following risks:\n`;
    prompt += `1. Sending funds to unknown or suspicious addresses\n`;
    prompt += `2. Approving unlimited token spending\n`;
    prompt += `3. Interacting with unverified or malicious contracts\n`;
    prompt += `4. Executing transactions with unexpected side effects\n\n`;

    prompt += `Respond with a JSON object containing:\n`;
    prompt += `{\n`;
    prompt += `  "safe": boolean, // true if the transaction appears safe, false otherwise\n`;
    prompt += `  "reason": string, // explanation of your assessment\n`;
    prompt += `  "recommendations": string[] // optional recommendations if there are concerns\n`;
    prompt += `}\n`;

    return prompt;
  }

  /**
   * Parse safety analysis from LLM response
   */
  private parseSafetyAnalysis(analysis: string): {
    safe: boolean;
    reason: string;
  } {
    try {
      // Extract JSON from the response
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { safe: false, reason: 'Could not parse safety analysis' };
      }

      const safetyResult = JSON.parse(jsonMatch[0]);
      return {
        safe: Boolean(safetyResult.safe),
        reason: safetyResult.reason || 'No reason provided',
      };
    } catch (error) {
      this.logger.error(
        `Error parsing safety analysis: ${error.message}`,
        error.stack,
      );
      return { safe: false, reason: 'Failed to parse safety analysis' };
    }
  }
}
