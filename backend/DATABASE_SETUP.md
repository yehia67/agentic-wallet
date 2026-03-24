# Database Setup Guide

## Overview

This agentic wallet system uses **PostgreSQL with pgvector** for persistent storage and **Redis** for caching. This setup follows best practices for AI agent systems with semantic search capabilities.

## Architecture

### PostgreSQL + pgvector
- **User Management**: Store user profiles, preferences, and settings
- **Wallet Data**: Track wallet addresses, balances, and transactions
- **Research Queries**: Store and semantically search past research with embeddings
- **Agent Sessions**: Maintain conversation history and context
- **Transactions**: Record all blockchain transactions

### Redis Cache Layer
- **Wallet Balances**: 1-minute TTL for frequently changing data
- **Research Results**: 1-hour TTL for expensive API calls
- **Agent Sessions**: 30-minute TTL for active conversations
- **User Preferences**: 24-hour TTL for settings
- **NFT Metadata**: 1-hour TTL for blockchain data

## Prerequisites

### Install PostgreSQL with pgvector

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew install pgvector
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-15 postgresql-contrib
sudo apt-get install postgresql-15-pgvector
sudo systemctl start postgresql
```

**Docker:**
```bash
docker run -d \
  --name agentic-wallet-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=agentic_wallet \
  -p 5432:5432 \
  ankane/pgvector
```

### Install Redis

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Docker:**
```bash
docker run -d \
  --name agentic-wallet-redis \
  -p 6379:6379 \
  redis:7-alpine
```

## Database Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE agentic_wallet;

# Connect to the database
\c agentic_wallet

# Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

# Verify extension
\dx
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update:

```env
# PostgreSQL
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=agentic_wallet
DATABASE_LOGGING=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
CACHE_TTL=3600
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Migrations

```bash
# Run migrations
npm run typeorm migration:run

# Revert if needed
npm run typeorm migration:revert
```

## Database Schema

### Users Table
- Stores user profiles and preferences
- Tracks agent mode preferences
- Links to wallets and sessions

### Wallets Table
- Stores wallet addresses and metadata
- Caches ETH and USDC balances
- Tracks primary wallet per user
- Links to transactions

### Research Queries Table
- Stores all research queries and responses
- **pgvector embeddings** for semantic search
- Tracks tokens used and response times
- Categorized by type (defi, nft, wallet, general)

### Agent Sessions Table
- Maintains conversation history
- Stores agent context and preferences
- Tracks executed actions and plans
- Links research queries to sessions

### Transactions Table
- Records all blockchain transactions
- Tracks status (pending, confirmed, failed)
- Stores gas usage and metadata

## Best Practices Implemented

### 1. Connection Pooling
```typescript
extra: {
  max: 20,                    // Maximum pool size
  idleTimeoutMillis: 30000,   // 30 seconds
  connectionTimeoutMillis: 2000
}
```

### 2. Indexing Strategy
- **B-tree indexes**: For exact matches (addresses, hashes, IDs)
- **Composite indexes**: For common query patterns
- **Vector indexes**: IVFFlat for semantic similarity search
- **Partial indexes**: For status-based queries

### 3. Caching Layers
```typescript
// Cache hierarchy
L1: Redis (hot data, 1-60 min TTL)
L2: PostgreSQL (persistent data)
L3: Blockchain RPC (source of truth)
```

### 4. Data Consistency
- Foreign key constraints with CASCADE
- JSONB for flexible metadata
- Timestamps for audit trails
- Soft deletes where appropriate

### 5. Semantic Search with pgvector
```typescript
// Find similar research queries
SELECT * FROM research_queries
WHERE embedding IS NOT NULL
ORDER BY embedding <=> '[...]'  -- Cosine similarity
LIMIT 5;
```

### 6. Repository Pattern
- Centralized data access
- Built-in caching logic
- Type-safe operations
- Consistent error handling

## Usage Examples

### User Repository
```typescript
import { UserRepository } from './database/repositories';

// Find or create user
const user = await userRepository.findOrCreate('user@example.com', {
  username: 'agent_user',
  defaultAgentMode: 'auto'
});

// Update preferences
await userRepository.updatePreferences(user.id, {
  theme: 'dark',
  notifications: true
});
```

### Wallet Repository
```typescript
import { WalletRepository } from './database/repositories';

// Create wallet
const wallet = await walletRepository.create({
  address: '0x...',
  userId: user.id,
  network: 'base-sepolia',
  isPrimary: true
});

// Update balances (with caching)
await walletRepository.updateBalances(
  wallet.address,
  '1.5',      // ETH
  '1000.0'    // USDC
);

// Get cached balances
const balances = await walletRepository.getBalances(wallet.address);
```

### Research Query Repository
```typescript
import { ResearchQueryRepository } from './database/repositories';

// Save research with embedding
const query = await researchRepository.create({
  userId: user.id,
  sessionId: 'session-123',
  query: 'What are the best DeFi protocols on Base?',
  response: '...',
  category: 'defi',
  embedding: [0.1, 0.2, ...], // OpenAI embedding
  tokensUsed: 500
});

// Semantic search
const similar = await researchRepository.findSimilar(
  embedding,
  5,      // limit
  0.8     // similarity threshold
);
```

### Agent Session Repository
```typescript
import { AgentSessionRepository } from './database/repositories';

// Create session
const session = await sessionRepository.create({
  sessionId: 'unique-session-id',
  userId: user.id,
  mode: 'auto'
});

// Add message
await sessionRepository.addMessage(session.sessionId, {
  role: 'user',
  content: 'Check my balance',
  timestamp: new Date()
});

// Track action
await sessionRepository.addExecutedAction(session.sessionId, {
  action: 'check_balance',
  params: { address: '0x...' },
  result: { eth: '1.5', usdc: '1000' },
  timestamp: new Date()
});
```

### Cache Service
```typescript
import { CacheService } from './database/services/cache.service';

// Get or set pattern
const balance = await cacheService.getOrSet(
  'wallet:balance',
  address,
  async () => {
    // Expensive operation
    return await fetchBalanceFromBlockchain(address);
  },
  60  // TTL in seconds
);

// Invalidate cache
await cacheService.invalidateWallet(address);

// Batch operations
await cacheService.mset('nft', [
  { key: '1', value: metadata1 },
  { key: '2', value: metadata2 }
], 3600);
```

## Monitoring

### Check Database Status
```bash
# PostgreSQL
psql -U postgres -d agentic_wallet -c "SELECT COUNT(*) FROM users;"
psql -U postgres -d agentic_wallet -c "SELECT COUNT(*) FROM research_queries WHERE embedding IS NOT NULL;"

# Redis
redis-cli INFO stats
redis-cli DBSIZE
redis-cli KEYS "wallet:*"
```

### Performance Queries
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::text))
FROM pg_tables
WHERE schemaname = 'public';

-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Maintenance

### Cleanup Old Data
```typescript
// Delete old sessions (30 days)
await sessionRepository.deleteOlderThan(30);

// Delete old research queries (90 days)
await researchRepository.deleteOlderThan(90);

// Cleanup expired sessions
await sessionRepository.cleanupExpired();
```

### Backup Database
```bash
# PostgreSQL backup
pg_dump -U postgres agentic_wallet > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres agentic_wallet < backup_20231201.sql

# Redis backup
redis-cli SAVE
```

## Troubleshooting

### pgvector Issues
```sql
-- Check if extension is installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Reinstall if needed
DROP EXTENSION IF EXISTS vector;
CREATE EXTENSION vector;
```

### Connection Issues
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Check Redis is running
redis-cli ping

# Check connections
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

### Performance Issues
```sql
-- Analyze tables
ANALYZE users;
ANALYZE wallets;
ANALYZE research_queries;

-- Reindex if needed
REINDEX TABLE research_queries;
```

## Production Considerations

1. **Connection Pooling**: Use PgBouncer for PostgreSQL
2. **Redis Persistence**: Enable AOF or RDB snapshots
3. **Backups**: Automated daily backups with retention
4. **Monitoring**: Set up Prometheus + Grafana
5. **Security**: Use SSL/TLS for connections
6. **Scaling**: Consider read replicas for PostgreSQL
7. **Migrations**: Always test in staging first

## Additional Resources

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [TypeORM Documentation](https://typeorm.io/)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
