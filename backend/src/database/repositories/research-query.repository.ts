import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResearchQuery } from '../entities/research-query.entity';
import { CacheService } from '../services/cache.service';

@Injectable()
export class ResearchQueryRepository {
  private readonly logger = new Logger(ResearchQueryRepository.name);

  constructor(
    @InjectRepository(ResearchQuery)
    private readonly repository: Repository<ResearchQuery>,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Create new research query
   */
  async create(queryData: Partial<ResearchQuery>): Promise<ResearchQuery> {
    const query = this.repository.create(queryData);
    const saved = await this.repository.save(query);

    // Cache the result if completed
    if (saved.status === 'completed' && saved.response) {
      const hash = this.cacheService.createHash({
        query: saved.query,
        category: saved.category,
      });
      await this.cacheService.setResearchQuery(hash, saved);
    }

    this.logger.log(`Research query created: ${saved.id}`);
    return saved;
  }

  /**
   * Find similar queries using semantic search (pgvector)
   */
  async findSimilar(
    embedding: number[],
    limit: number = 5,
    threshold: number = 0.8,
  ): Promise<ResearchQuery[]> {
    // Using pgvector cosine similarity
    const results = await this.repository
      .createQueryBuilder('query')
      .where('query.embedding IS NOT NULL')
      .andWhere('query.status = :status', { status: 'completed' })
      .orderBy(`query.embedding <=> '[${embedding.join(',')}]'`)
      .limit(limit)
      .getMany();

    return results;
  }

  /**
   * Find by query text with caching
   */
  async findByQueryText(
    queryText: string,
    category?: string,
  ): Promise<ResearchQuery | null> {
    const hash = this.cacheService.createHash({ query: queryText, category });

    // Check cache first
    const cached = await this.cacheService.getResearchQuery(hash);
    if (cached) {
      this.logger.debug(`Research query cache HIT: ${hash}`);
      return cached;
    }

    // Query database
    const whereClause: any = {
      query: queryText,
      status: 'completed',
    };

    if (category) {
      whereClause.category = category;
    }

    const result = await this.repository.findOne({
      where: whereClause,
      order: { createdAt: 'DESC' },
    });

    // Cache if found
    if (result) {
      await this.cacheService.setResearchQuery(hash, result);
    }

    return result;
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<ResearchQuery | null> {
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Update query
   */
  async update(
    id: string,
    updates: Partial<ResearchQuery>,
  ): Promise<ResearchQuery> {
    await this.repository.update(id, updates);
    const updated = await this.repository.findOne({ where: { id } });

    // Update cache if completed
    if (updated?.status === 'completed' && updated.response) {
      const hash = this.cacheService.createHash({
        query: updated.query,
        category: updated.category,
      });
      await this.cacheService.setResearchQuery(hash, updated);
    }

    return updated;
  }

  /**
   * Find queries by user
   */
  async findByUserId(
    userId: string,
    limit: number = 50,
  ): Promise<ResearchQuery[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Find queries by session
   */
  async findBySessionId(sessionId: string): Promise<ResearchQuery[]> {
    return this.repository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Find queries by category
   */
  async findByCategory(
    category: string,
    limit: number = 50,
  ): Promise<ResearchQuery[]> {
    return this.repository.find({
      where: { category, status: 'completed' },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get query statistics
   */
  async getStats(userId?: string): Promise<{
    total: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
    avgResponseTime: number;
    totalTokens: number;
  }> {
    const queryBuilder = this.repository.createQueryBuilder('query');

    if (userId) {
      queryBuilder.where('query.userId = :userId', { userId });
    }

    const queries = await queryBuilder.getMany();

    const stats = {
      total: queries.length,
      byCategory: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      avgResponseTime: 0,
      totalTokens: 0,
    };

    let totalResponseTime = 0;

    queries.forEach((query) => {
      // Category stats
      stats.byCategory[query.category] =
        (stats.byCategory[query.category] || 0) + 1;

      // Status stats
      stats.byStatus[query.status] = (stats.byStatus[query.status] || 0) + 1;

      // Response time
      totalResponseTime += query.responseTimeMs;

      // Tokens
      stats.totalTokens += query.tokensUsed;
    });

    stats.avgResponseTime =
      queries.length > 0 ? totalResponseTime / queries.length : 0;

    return stats;
  }

  /**
   * Delete old queries (cleanup)
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoff', { cutoff })
      .execute();

    this.logger.log(`Deleted ${result.affected} old research queries`);
    return result.affected || 0;
  }

  /**
   * Search queries by text
   */
  async search(
    searchText: string,
    category?: string,
    limit: number = 20,
  ): Promise<ResearchQuery[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('query')
      .where('query.query ILIKE :search', { search: `%${searchText}%` })
      .orWhere('query.response ILIKE :search', { search: `%${searchText}%` })
      .andWhere('query.status = :status', { status: 'completed' });

    if (category) {
      queryBuilder.andWhere('query.category = :category', { category });
    }

    return queryBuilder
      .orderBy('query.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }
}
