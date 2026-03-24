import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CacheService } from '../services/cache.service';

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Find user by ID with caching
   */
  async findById(id: string): Promise<User | null> {
    return this.cacheService.getOrSet(
      'user',
      id,
      async () => {
        const user = await this.repository.findOne({ where: { id } });
        return user;
      },
      3600, // 1 hour
    );
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  /**
   * Create new user
   */
  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    const saved = await this.repository.save(user);
    
    // Cache the new user
    await this.cacheService.set('user', saved.id, saved, 3600);
    
    this.logger.log(`User created: ${saved.id}`);
    return saved;
  }

  /**
   * Update user
   */
  async update(id: string, updates: Partial<User>): Promise<User> {
    await this.repository.update(id, updates);
    
    // Invalidate cache
    await this.cacheService.delete('user', id);
    await this.cacheService.delete('user:prefs', id);
    
    const updated = await this.repository.findOne({ where: { id } });
    
    // Re-cache
    if (updated) {
      await this.cacheService.set('user', id, updated, 3600);
    }
    
    return updated;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    id: string,
    preferences: Record<string, any>,
  ): Promise<User> {
    return this.update(id, { preferences });
  }

  /**
   * Update last active timestamp
   */
  async updateLastActive(id: string): Promise<void> {
    await this.repository.update(id, { lastActiveAt: new Date() });
    // Don't invalidate cache for this minor update
  }

  /**
   * Get user with relations
   */
  async findWithWallets(id: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['wallets'],
    });
  }

  /**
   * Get user with all relations
   */
  async findWithAllRelations(id: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['wallets', 'agentSessions'],
    });
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
    await this.cacheService.delete('user', id);
    await this.cacheService.delete('user:prefs', id);
    this.logger.log(`User deleted: ${id}`);
  }

  /**
   * Find or create user by email
   */
  async findOrCreate(email: string, defaults?: Partial<User>): Promise<User> {
    let user = await this.findByEmail(email);
    
    if (!user) {
      user = await this.create({ email, ...defaults });
    }
    
    return user;
  }
}
