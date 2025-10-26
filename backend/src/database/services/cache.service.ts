import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * CacheService - Centralized caching layer for agent operations
 * 
 * Best practices implemented:
 * 1. Namespace-based key organization
 * 2. TTL management per data type
 * 3. Batch operations for efficiency
 * 4. Cache invalidation patterns
 * 5. Error handling and fallback
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  // Cache TTL configurations (in seconds)
  private readonly TTL = {
    WALLET_BALANCE: 60, // 1 minute - frequently changing
    WALLET_DATA: 300, // 5 minutes - semi-static
    RESEARCH_QUERY: 3600, // 1 hour - research results
    AGENT_SESSION: 1800, // 30 minutes - active sessions
    USER_PREFERENCES: 86400, // 24 hours - user settings
    NFT_METADATA: 3600, // 1 hour - NFT data
    TRANSACTION: 300, // 5 minutes - transaction data
  };

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Generic get with namespace
   */
  async get<T>(namespace: string, key: string): Promise<T | null> {
    try {
      const fullKey = this.buildKey(namespace, key);
      const value = await this.cacheManager.get<T>(fullKey);
      
      if (value) {
        this.logger.debug(`Cache HIT: ${fullKey}`);
      } else {
        this.logger.debug(`Cache MISS: ${fullKey}`);
      }
      
      return value || null;
    } catch (error) {
      this.logger.error(`Cache get error: ${error.message}`);
      return null;
    }
  }

  /**
   * Generic set with namespace and TTL
   */
  async set<T>(
    namespace: string,
    key: string,
    value: T,
    ttl?: number,
  ): Promise<void> {
    try {
      const fullKey = this.buildKey(namespace, key);
      await this.cacheManager.set(fullKey, value, ttl ? ttl * 1000 : undefined);
      this.logger.debug(`Cache SET: ${fullKey} (TTL: ${ttl || 'default'}s)`);
    } catch (error) {
      this.logger.error(`Cache set error: ${error.message}`);
    }
  }

  /**
   * Delete a specific key
   */
  async delete(namespace: string, key: string): Promise<void> {
    try {
      const fullKey = this.buildKey(namespace, key);
      await this.cacheManager.del(fullKey);
      this.logger.debug(`Cache DELETE: ${fullKey}`);
    } catch (error) {
      this.logger.error(`Cache delete error: ${error.message}`);
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function
   */
  async getOrSet<T>(
    namespace: string,
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(namespace, key);
    
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(namespace, key, value, ttl);
    return value;
  }

  /**
   * Wallet-specific cache methods
   */
  async getWalletBalance(address: string): Promise<any> {
    return this.get('wallet:balance', address);
  }

  async setWalletBalance(address: string, balance: any): Promise<void> {
    return this.set('wallet:balance', address, balance, this.TTL.WALLET_BALANCE);
  }

  async getWalletData(address: string): Promise<any> {
    return this.get('wallet:data', address);
  }

  async setWalletData(address: string, data: any): Promise<void> {
    return this.set('wallet:data', address, data, this.TTL.WALLET_DATA);
  }

  async invalidateWallet(address: string): Promise<void> {
    await this.delete('wallet:balance', address);
    await this.delete('wallet:data', address);
  }

  /**
   * Research query cache methods
   */
  async getResearchQuery(queryHash: string): Promise<any> {
    return this.get('research', queryHash);
  }

  async setResearchQuery(queryHash: string, result: any): Promise<void> {
    return this.set('research', queryHash, result, this.TTL.RESEARCH_QUERY);
  }

  /**
   * Agent session cache methods
   */
  async getAgentSession(sessionId: string): Promise<any> {
    return this.get('session', sessionId);
  }

  async setAgentSession(sessionId: string, session: any): Promise<void> {
    return this.set('session', sessionId, session, this.TTL.AGENT_SESSION);
  }

  async deleteAgentSession(sessionId: string): Promise<void> {
    return this.delete('session', sessionId);
  }

  /**
   * User preferences cache
   */
  async getUserPreferences(userId: string): Promise<any> {
    return this.get('user:prefs', userId);
  }

  async setUserPreferences(userId: string, prefs: any): Promise<void> {
    return this.set('user:prefs', userId, prefs, this.TTL.USER_PREFERENCES);
  }

  /**
   * NFT metadata cache
   */
  async getNFTMetadata(tokenId: string): Promise<any> {
    return this.get('nft', tokenId);
  }

  async setNFTMetadata(tokenId: string, metadata: any): Promise<void> {
    return this.set('nft', tokenId, metadata, this.TTL.NFT_METADATA);
  }

  /**
   * Transaction cache
   */
  async getTransaction(hash: string): Promise<any> {
    return this.get('tx', hash);
  }

  async setTransaction(hash: string, tx: any): Promise<void> {
    return this.set('tx', hash, tx, this.TTL.TRANSACTION);
  }

  /**
   * Batch operations
   */
  async mget<T>(namespace: string, keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map((key) => this.get<T>(namespace, key)));
  }

  async mset<T>(
    namespace: string,
    entries: Array<{ key: string; value: T }>,
    ttl?: number,
  ): Promise<void> {
    await Promise.all(
      entries.map((entry) =>
        this.set(namespace, entry.key, entry.value, ttl),
      ),
    );
  }

  /**
   * Clear all cache (use with caution)
   */
  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset();
      this.logger.warn('Cache RESET - All keys cleared');
    } catch (error) {
      this.logger.error(`Cache reset error: ${error.message}`);
    }
  }

  /**
   * Build namespaced key
   */
  private buildKey(namespace: string, key: string): string {
    return `${namespace}:${key}`;
  }

  /**
   * Create hash for complex objects (useful for research queries)
   */
  createHash(obj: any): string {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
