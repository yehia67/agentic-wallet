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
    balance?: number;
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
          return await this.checkBalance();
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
   */
  private async checkBalance(): Promise<WalletAgentResponse> {
    try {
      const address = await this.walletService.getWalletAddress();
      const balance = await this.walletService.getUsdcBalance();
      const explorerUrl = this.walletService.getWalletUrl();

      return {
        success: true,
        message: `Wallet balance retrieved successfully`,
        data: {
          address,
          balance,
          explorerUrl,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to check wallet balance',
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
      const txHash = await this.walletService.sendTransaction(
        request.parameters.to,
        request.parameters.data || '0x',
      );
      const explorerUrl = this.walletService.getTransactionUrl(txHash);

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
      const txHash = await this.walletService.approveToken(
        request.parameters.spender,
      );
      const explorerUrl = this.walletService.getTransactionUrl(txHash);

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

      const txHash = await this.walletService.batchTransactions(
        formattedTransactions,
      );
      const explorerUrl = this.walletService.getTransactionUrl(txHash);

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
