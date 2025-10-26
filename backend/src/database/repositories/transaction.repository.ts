import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { CacheService } from '../services/cache.service';

@Injectable()
export class TransactionRepository {
  private readonly logger = new Logger(TransactionRepository.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Find transaction by hash with caching
   */
  async findByHash(hash: string): Promise<Transaction | null> {
    return this.cacheService.getOrSet(
      'tx',
      hash.toLowerCase(),
      async () => {
        const tx = await this.repository.findOne({
          where: { hash: hash.toLowerCase() },
        });
        return tx;
      },
      300, // 5 minutes
    );
  }

  /**
   * Create new transaction
   */
  async create(txData: Partial<Transaction>): Promise<Transaction> {
    // Normalize addresses and hash
    if (txData.hash) {
      txData.hash = txData.hash.toLowerCase();
    }
    if (txData.from) {
      txData.from = txData.from.toLowerCase();
    }
    if (txData.to) {
      txData.to = txData.to.toLowerCase();
    }

    const tx = this.repository.create(txData);
    const saved = await this.repository.save(tx);

    // Cache the transaction
    await this.cacheService.setTransaction(saved.hash, saved);

    this.logger.log(`Transaction created: ${saved.hash}`);
    return saved;
  }

  /**
   * Update transaction
   */
  async update(hash: string, updates: Partial<Transaction>): Promise<Transaction> {
    const normalizedHash = hash.toLowerCase();
    await this.repository.update({ hash: normalizedHash }, updates);

    // Invalidate cache
    await this.cacheService.delete('tx', normalizedHash);

    const updated = await this.repository.findOne({
      where: { hash: normalizedHash },
    });

    // Re-cache
    if (updated) {
      await this.cacheService.setTransaction(normalizedHash, updated);
    }

    return updated;
  }

  /**
   * Update transaction status
   */
  async updateStatus(
    hash: string,
    status: string,
    blockNumber?: number,
  ): Promise<void> {
    const updates: Partial<Transaction> = { status };

    if (status === 'confirmed' && blockNumber) {
      updates.blockNumber = blockNumber;
      updates.confirmedAt = new Date();
    }

    await this.update(hash, updates);
  }

  /**
   * Find transactions by wallet
   */
  async findByWalletId(
    walletId: string,
    limit: number = 50,
  ): Promise<Transaction[]> {
    return this.repository.find({
      where: { walletId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Find transactions by address (from or to)
   */
  async findByAddress(
    address: string,
    limit: number = 50,
  ): Promise<Transaction[]> {
    const normalizedAddress = address.toLowerCase();

    return this.repository
      .createQueryBuilder('tx')
      .where('tx.from = :address', { address: normalizedAddress })
      .orWhere('tx.to = :address', { address: normalizedAddress })
      .orderBy('tx.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Find pending transactions
   */
  async findPending(walletId?: string): Promise<Transaction[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('tx')
      .where('tx.status = :status', { status: 'pending' });

    if (walletId) {
      queryBuilder.andWhere('tx.walletId = :walletId', { walletId });
    }

    return queryBuilder.orderBy('tx.createdAt', 'ASC').getMany();
  }

  /**
   * Find transactions by type
   */
  async findByType(
    type: string,
    walletId?: string,
    limit: number = 50,
  ): Promise<Transaction[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('tx')
      .where('tx.type = :type', { type });

    if (walletId) {
      queryBuilder.andWhere('tx.walletId = :walletId', { walletId });
    }

    return queryBuilder
      .orderBy('tx.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get transaction statistics
   */
  async getStats(walletId?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    totalValue: string;
    avgGasUsed: string;
  }> {
    const queryBuilder = this.repository.createQueryBuilder('tx');

    if (walletId) {
      queryBuilder.where('tx.walletId = :walletId', { walletId });
    }

    const transactions = await queryBuilder.getMany();

    const stats = {
      total: transactions.length,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      totalValue: '0',
      avgGasUsed: '0',
    };

    let totalValue = 0;
    let totalGasUsed = 0;
    let gasCount = 0;

    transactions.forEach((tx) => {
      // Type stats
      stats.byType[tx.type] = (stats.byType[tx.type] || 0) + 1;

      // Status stats
      stats.byStatus[tx.status] = (stats.byStatus[tx.status] || 0) + 1;

      // Value
      totalValue += parseFloat(tx.value || '0');

      // Gas
      if (tx.gasUsed) {
        totalGasUsed += parseFloat(tx.gasUsed);
        gasCount++;
      }
    });

    stats.totalValue = totalValue.toString();
    stats.avgGasUsed = gasCount > 0 ? (totalGasUsed / gasCount).toString() : '0';

    return stats;
  }

  /**
   * Delete old transactions
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoff', { cutoff })
      .andWhere('status != :status', { status: 'pending' })
      .execute();

    this.logger.log(`Deleted ${result.affected} old transactions`);
    return result.affected || 0;
  }

  /**
   * Find recent transactions
   */
  async findRecent(limit: number = 20): Promise<Transaction[]> {
    return this.repository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
