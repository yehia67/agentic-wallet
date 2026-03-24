import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import { CacheService } from '../services/cache.service';

@Injectable()
export class WalletRepository {
  private readonly logger = new Logger(WalletRepository.name);

  constructor(
    @InjectRepository(Wallet)
    private readonly repository: Repository<Wallet>,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Find wallet by address with caching
   */
  async findByAddress(address: string): Promise<Wallet | null> {
    return this.cacheService.getOrSet(
      'wallet',
      address.toLowerCase(),
      async () => {
        const wallet = await this.repository.findOne({
          where: { address: address.toLowerCase() },
        });
        return wallet;
      },
      300, // 5 minutes
    );
  }

  /**
   * Find wallet by ID
   */
  async findById(id: string): Promise<Wallet | null> {
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Create new wallet
   */
  async create(walletData: Partial<Wallet>): Promise<Wallet> {
    // Normalize address
    if (walletData.address) {
      walletData.address = walletData.address.toLowerCase();
    }

    const wallet = this.repository.create(walletData);
    const saved = await this.repository.save(wallet);

    // Cache the wallet
    await this.cacheService.setWalletData(saved.address, saved);

    this.logger.log(`Wallet created: ${saved.address}`);
    return saved;
  }

  /**
   * Update wallet
   */
  async update(id: string, updates: Partial<Wallet>): Promise<Wallet> {
    await this.repository.update(id, updates);

    const updated = await this.repository.findOne({ where: { id } });

    // Invalidate cache
    if (updated) {
      await this.cacheService.invalidateWallet(updated.address);
    }

    return updated;
  }

  /**
   * Update wallet balances
   */
  async updateBalances(
    address: string,
    ethBalance: string,
    usdcBalance: string,
  ): Promise<void> {
    const normalizedAddress = address.toLowerCase();

    await this.repository.update(
      { address: normalizedAddress },
      {
        ethBalance,
        usdcBalance,
        lastBalanceUpdate: new Date(),
      },
    );

    // Update cache
    const balances = { ethBalance, usdcBalance, lastBalanceUpdate: new Date() };
    await this.cacheService.setWalletBalance(normalizedAddress, balances);

    this.logger.debug(`Balances updated for ${normalizedAddress}`);
  }

  /**
   * Get cached balance or fetch from DB
   */
  async getBalances(address: string): Promise<{
    ethBalance: string;
    usdcBalance: string;
    lastBalanceUpdate: Date;
  } | null> {
    const normalizedAddress = address.toLowerCase();

    // Try cache first
    const cached = await this.cacheService.getWalletBalance(normalizedAddress);
    if (cached) {
      return cached;
    }

    // Fetch from DB
    const wallet = await this.findByAddress(normalizedAddress);
    if (!wallet) {
      return null;
    }

    const balances = {
      ethBalance: wallet.ethBalance,
      usdcBalance: wallet.usdcBalance,
      lastBalanceUpdate: wallet.lastBalanceUpdate,
    };

    // Cache for next time
    await this.cacheService.setWalletBalance(normalizedAddress, balances);

    return balances;
  }

  /**
   * Find all wallets for a user
   */
  async findByUserId(userId: string): Promise<Wallet[]> {
    return this.repository.find({
      where: { userId, isActive: true },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });
  }

  /**
   * Find user's primary wallet
   */
  async findPrimaryWallet(userId: string): Promise<Wallet | null> {
    return this.repository.findOne({
      where: { userId, isPrimary: true, isActive: true },
    });
  }

  /**
   * Set wallet as primary
   */
  async setPrimary(walletId: string, userId: string): Promise<void> {
    // Unset all other primary wallets for this user
    await this.repository.update(
      { userId, isPrimary: true },
      { isPrimary: false },
    );

    // Set this wallet as primary
    await this.repository.update({ id: walletId }, { isPrimary: true });

    this.logger.log(`Primary wallet set: ${walletId} for user ${userId}`);
  }

  /**
   * Find wallet with transactions
   */
  async findWithTransactions(address: string): Promise<Wallet | null> {
    return this.repository.findOne({
      where: { address: address.toLowerCase() },
      relations: ['transactions'],
      order: {
        transactions: {
          createdAt: 'DESC',
        },
      },
    });
  }

  /**
   * Delete wallet
   */
  async delete(id: string): Promise<void> {
    const wallet = await this.findById(id);
    if (wallet) {
      await this.cacheService.invalidateWallet(wallet.address);
    }

    await this.repository.delete(id);
    this.logger.log(`Wallet deleted: ${id}`);
  }

  /**
   * Find or create wallet
   */
  async findOrCreate(
    address: string,
    defaults?: Partial<Wallet>,
  ): Promise<Wallet> {
    const normalizedAddress = address.toLowerCase();
    let wallet = await this.findByAddress(normalizedAddress);

    if (!wallet) {
      wallet = await this.create({ address: normalizedAddress, ...defaults });
    }

    return wallet;
  }

  /**
   * Get wallets needing balance update
   */
  async findStaleBalances(olderThanMinutes: number = 5): Promise<Wallet[]> {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);

    return this.repository
      .createQueryBuilder('wallet')
      .where('wallet.isActive = :isActive', { isActive: true })
      .andWhere(
        '(wallet.lastBalanceUpdate IS NULL OR wallet.lastBalanceUpdate < :cutoff)',
        { cutoff },
      )
      .getMany();
  }
}
