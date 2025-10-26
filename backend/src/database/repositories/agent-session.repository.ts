import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { AgentSession } from '../entities/agent-session.entity';
import { CacheService } from '../services/cache.service';

@Injectable()
export class AgentSessionRepository {
  private readonly logger = new Logger(AgentSessionRepository.name);

  constructor(
    @InjectRepository(AgentSession)
    private readonly repository: Repository<AgentSession>,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Find session by sessionId with caching
   */
  async findBySessionId(sessionId: string): Promise<AgentSession | null> {
    return this.cacheService.getOrSet(
      'session',
      sessionId,
      async () => {
        const session = await this.repository.findOne({
          where: { sessionId },
        });
        return session;
      },
      1800, // 30 minutes
    );
  }

  /**
   * Create new session
   */
  async create(sessionData: Partial<AgentSession>): Promise<AgentSession> {
    // Set default expiration (24 hours from now)
    if (!sessionData.expiresAt) {
      sessionData.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    sessionData.lastActivityAt = new Date();

    const session = this.repository.create(sessionData);
    const saved = await this.repository.save(session);

    // Cache the session
    await this.cacheService.setAgentSession(saved.sessionId, saved);

    this.logger.log(`Agent session created: ${saved.sessionId}`);
    return saved;
  }

  /**
   * Update session
   */
  async update(
    sessionId: string,
    updates: Partial<AgentSession>,
  ): Promise<AgentSession> {
    updates.lastActivityAt = new Date();

    await this.repository.update({ sessionId }, updates);

    // Invalidate cache
    await this.cacheService.deleteAgentSession(sessionId);

    const updated = await this.repository.findOne({ where: { sessionId } });

    // Re-cache
    if (updated) {
      await this.cacheService.setAgentSession(sessionId, updated);
    }

    return updated;
  }

  /**
   * Add message to session
   */
  async addMessage(
    sessionId: string,
    message: {
      role: 'user' | 'assistant' | 'system';
      content: string;
      timestamp: Date;
    },
  ): Promise<void> {
    const session = await this.findBySessionId(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.messages.push(message);
    session.totalMessages += 1;

    await this.update(sessionId, {
      messages: session.messages,
      totalMessages: session.totalMessages,
    });
  }

  /**
   * Add executed action to session
   */
  async addExecutedAction(
    sessionId: string,
    action: {
      action: string;
      params: any;
      result: any;
      timestamp: Date;
    },
  ): Promise<void> {
    const session = await this.findBySessionId(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.executedActions.push(action);

    await this.update(sessionId, {
      executedActions: session.executedActions,
    });
  }

  /**
   * Update session context
   */
  async updateContext(
    sessionId: string,
    context: Record<string, any>,
  ): Promise<void> {
    const session = await this.findBySessionId(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    await this.update(sessionId, {
      context: { ...session.context, ...context },
    });
  }

  /**
   * Update session preferences
   */
  async updatePreferences(
    sessionId: string,
    preferences: Record<string, any>,
  ): Promise<void> {
    const session = await this.findBySessionId(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    await this.update(sessionId, {
      preferences: { ...session.preferences, ...preferences },
    });
  }

  /**
   * Add research query to session
   */
  async addResearchQuery(
    sessionId: string,
    queryId: string,
  ): Promise<void> {
    const session = await this.findBySessionId(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (!session.researchQueries.includes(queryId)) {
      session.researchQueries.push(queryId);

      await this.update(sessionId, {
        researchQueries: session.researchQueries,
      });
    }
  }

  /**
   * Increment cycle count
   */
  async incrementCycleCount(sessionId: string): Promise<void> {
    const session = await this.findBySessionId(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    await this.update(sessionId, {
      cycleCount: session.cycleCount + 1,
    });
  }

  /**
   * Update token usage
   */
  async addTokenUsage(sessionId: string, tokens: number): Promise<void> {
    const session = await this.findBySessionId(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    await this.update(sessionId, {
      totalTokensUsed: session.totalTokensUsed + tokens,
    });
  }

  /**
   * Find sessions by user
   */
  async findByUserId(
    userId: string,
    limit: number = 50,
  ): Promise<AgentSession[]> {
    return this.repository.find({
      where: { userId },
      order: { lastActivityAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Find active sessions
   */
  async findActiveSessions(userId?: string): Promise<AgentSession[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('session')
      .where('session.status = :status', { status: 'active' })
      .andWhere('session.expiresAt > :now', { now: new Date() });

    if (userId) {
      queryBuilder.andWhere('session.userId = :userId', { userId });
    }

    return queryBuilder
      .orderBy('session.lastActivityAt', 'DESC')
      .getMany();
  }

  /**
   * Complete session
   */
  async complete(sessionId: string): Promise<void> {
    await this.update(sessionId, { status: 'completed' });
    this.logger.log(`Session completed: ${sessionId}`);
  }

  /**
   * Expire session
   */
  async expire(sessionId: string): Promise<void> {
    await this.update(sessionId, { status: 'expired' });
    await this.cacheService.deleteAgentSession(sessionId);
    this.logger.log(`Session expired: ${sessionId}`);
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpired(): Promise<number> {
    const result = await this.repository.update(
      {
        expiresAt: LessThan(new Date()),
        status: 'active',
      },
      { status: 'expired' },
    );

    this.logger.log(`Cleaned up ${result.affected} expired sessions`);
    return result.affected || 0;
  }

  /**
   * Delete old sessions
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoff', { cutoff })
      .andWhere('status != :status', { status: 'active' })
      .execute();

    this.logger.log(`Deleted ${result.affected} old sessions`);
    return result.affected || 0;
  }

  /**
   * Get session statistics
   */
  async getStats(userId?: string): Promise<{
    total: number;
    active: number;
    completed: number;
    expired: number;
    avgMessages: number;
    avgTokens: number;
    avgCycles: number;
  }> {
    const queryBuilder = this.repository.createQueryBuilder('session');

    if (userId) {
      queryBuilder.where('session.userId = :userId', { userId });
    }

    const sessions = await queryBuilder.getMany();

    const stats = {
      total: sessions.length,
      active: 0,
      completed: 0,
      expired: 0,
      avgMessages: 0,
      avgTokens: 0,
      avgCycles: 0,
    };

    let totalMessages = 0;
    let totalTokens = 0;
    let totalCycles = 0;

    sessions.forEach((session) => {
      if (session.status === 'active') stats.active++;
      if (session.status === 'completed') stats.completed++;
      if (session.status === 'expired') stats.expired++;

      totalMessages += session.totalMessages;
      totalTokens += session.totalTokensUsed;
      totalCycles += session.cycleCount;
    });

    if (sessions.length > 0) {
      stats.avgMessages = totalMessages / sessions.length;
      stats.avgTokens = totalTokens / sessions.length;
      stats.avgCycles = totalCycles / sessions.length;
    }

    return stats;
  }
}
