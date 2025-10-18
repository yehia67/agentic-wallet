import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { WalletService } from '../shared/services/wallet.service';
import { formatEther, parseEther } from 'viem';

interface SendTransactionDto {
  to: string;
  value: string; // ETH amount as string
  data?: string;
}

interface TransferDto {
  to: string;
  amount: string; // Amount as string
}

interface BatchTransactionDto {
  transactions: SendTransactionDto[];
}

@Controller('wallet')
export class WalletController {
  private readonly logger = new Logger(WalletController.name);

  constructor(private readonly walletService: WalletService) {}

  /**
   * Get wallet address
   */
  @Get('address')
  async getAddress(): Promise<{ address: string }> {
    try {
      const address = await this.walletService.getAddress();
      return { address };
    } catch (error) {
      this.logger.error('Failed to get wallet address', error);
      throw new HttpException(
        'Failed to get wallet address',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get ETH balance
   */
  @Get('balance')
  async getBalance(): Promise<{ balance: string; balanceWei: string }> {
    try {
      const balanceWei = await this.walletService.getBalance();
      const balance = formatEther(balanceWei);
      
      return {
        balance,
        balanceWei: balanceWei.toString(),
      };
    } catch (error) {
      this.logger.error('Failed to get balance', error);
      throw new HttpException(
        'Failed to get balance',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get USDC balance
   */
  @Get('balance/usdc')
  async getUsdcBalance(): Promise<{ balance: string; balanceRaw: string }> {
    try {
      const balanceRaw = await this.walletService.getUsdcBalance();
      // USDC has 6 decimals
      const balance = (Number(balanceRaw) / 1e6).toString();
      
      return {
        balance,
        balanceRaw: balanceRaw.toString(),
      };
    } catch (error) {
      this.logger.error('Failed to get USDC balance', error);
      throw new HttpException(
        'Failed to get USDC balance',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Send a transaction
   */
  @Post('send')
  async sendTransaction(
    @Body() sendDto: SendTransactionDto,
  ): Promise<{ hash: string; explorerUrl: string }> {
    try {
      const { to, value, data = '0x' } = sendDto;
      
      if (!to) {
        throw new HttpException('Recipient address is required', HttpStatus.BAD_REQUEST);
      }

      const valueWei = value ? parseEther(value) : 0n;
      
      const hash = await this.walletService.sendTransaction({
        to,
        value: valueWei,
        data,
      });

      const explorerUrl = this.walletService.getExplorerUrl(hash);

      return { hash, explorerUrl };
    } catch (error) {
      this.logger.error('Failed to send transaction', error);
      throw new HttpException(
        error.message || 'Failed to send transaction',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Send batch transactions
   */
  @Post('send/batch')
  async sendBatchTransaction(
    @Body() batchDto: BatchTransactionDto,
  ): Promise<{ hash: string; explorerUrl: string }> {
    try {
      const { transactions } = batchDto;
      
      if (!transactions || transactions.length === 0) {
        throw new HttpException('Transactions array is required', HttpStatus.BAD_REQUEST);
      }

      const txs = transactions.map(tx => ({
        to: tx.to,
        value: tx.value ? parseEther(tx.value) : 0n,
        data: tx.data || '0x',
      }));
      
      const hash = await this.walletService.sendBatchTransaction(txs);
      const explorerUrl = this.walletService.getExplorerUrl(hash);

      return { hash, explorerUrl };
    } catch (error) {
      this.logger.error('Failed to send batch transaction', error);
      throw new HttpException(
        error.message || 'Failed to send batch transaction',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Send sponsored transaction
   */
  @Post('send/sponsored')
  async sendSponsoredTransaction(
    @Body() body: SendTransactionDto & { paymasterUrl: string },
  ): Promise<{ hash: string; explorerUrl: string }> {
    try {
      const { to, value, data = '0x', paymasterUrl } = body;
      
      if (!to) {
        throw new HttpException('Recipient address is required', HttpStatus.BAD_REQUEST);
      }

      if (!paymasterUrl) {
        throw new HttpException('Paymaster URL is required', HttpStatus.BAD_REQUEST);
      }

      const valueWei = value ? parseEther(value) : 0n;
      
      const hash = await this.walletService.sendSponsoredTransaction(
        {
          to,
          value: valueWei,
          data,
        },
        paymasterUrl,
      );

      const explorerUrl = this.walletService.getExplorerUrl(hash);

      return { hash, explorerUrl };
    } catch (error) {
      this.logger.error('Failed to send sponsored transaction', error);
      throw new HttpException(
        error.message || 'Failed to send sponsored transaction',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Transfer ETH
   */
  @Post('transfer/eth')
  async transferEth(
    @Body() transferDto: TransferDto,
  ): Promise<{ hash: string; explorerUrl: string }> {
    try {
      const { to, amount } = transferDto;
      
      if (!to || !amount) {
        throw new HttpException('Recipient address and amount are required', HttpStatus.BAD_REQUEST);
      }

      const amountWei = parseEther(amount);
      const hash = await this.walletService.transferEth(to, amountWei);
      const explorerUrl = this.walletService.getExplorerUrl(hash);

      return { hash, explorerUrl };
    } catch (error) {
      this.logger.error('Failed to transfer ETH', error);
      throw new HttpException(
        error.message || 'Failed to transfer ETH',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Transfer USDC
   */
  @Post('transfer/usdc')
  async transferUsdc(
    @Body() transferDto: TransferDto,
  ): Promise<{ hash: string; explorerUrl: string }> {
    try {
      const { to, amount } = transferDto;
      
      if (!to || !amount) {
        throw new HttpException('Recipient address and amount are required', HttpStatus.BAD_REQUEST);
      }

      // Convert USDC amount to smallest unit (6 decimals)
      const amountRaw = BigInt(Math.floor(parseFloat(amount) * 1e6));
      const hash = await this.walletService.transferUsdc(to, amountRaw);
      const explorerUrl = this.walletService.getExplorerUrl(hash);

      return { hash, explorerUrl };
    } catch (error) {
      this.logger.error('Failed to transfer USDC', error);
      throw new HttpException(
        error.message || 'Failed to transfer USDC',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
