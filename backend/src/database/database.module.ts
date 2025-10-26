import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { User } from './entities/user.entity';
import { Wallet } from './entities/wallet.entity';
import { ResearchQuery } from './entities/research-query.entity';
import { AgentSession } from './entities/agent-session.entity';
import { Transaction } from './entities/transaction.entity';
import { CacheService } from './services/cache.service';
import {
  UserRepository,
  WalletRepository,
  ResearchQueryRepository,
  AgentSessionRepository,
  TransactionRepository,
} from './repositories';

@Module({
  imports: [
    // PostgreSQL with TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USER', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', 'agentic_wallet'),
        entities: [User, Wallet, ResearchQuery, AgentSession, Transaction],
        synchronize: configService.get('NODE_ENV') !== 'production', // Auto-sync in dev only
        logging: configService.get('DATABASE_LOGGING', false),
        // Connection pool settings for better performance
        extra: {
          max: 20, // Maximum pool size
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
        // Enable pgvector extension
        installExtensions: true,
      }),
    }),

    // Redis Cache Configuration
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
          },
          password: configService.get('REDIS_PASSWORD'),
          database: configService.get('REDIS_DB', 0),
          ttl: configService.get('CACHE_TTL', 3600) * 1000, // Default 1 hour
        }),
        isGlobal: true,
      }),
    }),

    // Register entities for injection
    TypeOrmModule.forFeature([
      User,
      Wallet,
      ResearchQuery,
      AgentSession,
      Transaction,
    ]),
  ],
  providers: [
    CacheService,
    UserRepository,
    WalletRepository,
    ResearchQueryRepository,
    AgentSessionRepository,
    TransactionRepository,
  ],
  exports: [
    TypeOrmModule,
    CacheService,
    UserRepository,
    WalletRepository,
    ResearchQueryRepository,
    AgentSessionRepository,
    TransactionRepository,
  ],
})
export class DatabaseModule {}
