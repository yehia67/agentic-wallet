import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable pgvector extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar(255) UNIQUE,
        "username" varchar(100),
        "preferences" jsonb DEFAULT '{}',
        "metadata" jsonb DEFAULT '{}',
        "defaultAgentMode" varchar(50) DEFAULT 'auto',
        "isActive" boolean DEFAULT true,
        "lastActiveAt" timestamp,
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now()
      )
    `);

    // Create indexes for users
    await queryRunner.query(
      `CREATE INDEX "IDX_users_email" ON "users" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_createdAt" ON "users" ("createdAt")`,
    );

    // Create wallets table
    await queryRunner.query(`
      CREATE TABLE "wallets" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "address" varchar(42) UNIQUE NOT NULL,
        "label" varchar(255),
        "userId" uuid,
        "network" varchar(50) DEFAULT 'base-sepolia',
        "isActive" boolean DEFAULT true,
        "isPrimary" boolean DEFAULT false,
        "ethBalance" decimal(36,18) DEFAULT 0,
        "usdcBalance" decimal(36,6) DEFAULT 0,
        "lastBalanceUpdate" timestamp,
        "encryptedPrivateKey" text,
        "metadata" jsonb DEFAULT '{}',
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now(),
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for wallets
    await queryRunner.query(
      `CREATE INDEX "IDX_wallets_address" ON "wallets" ("address")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_wallets_userId" ON "wallets" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_wallets_createdAt" ON "wallets" ("createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_wallets_isActive" ON "wallets" ("isActive")`,
    );

    // Create research_queries table with pgvector
    await queryRunner.query(`
      CREATE TABLE "research_queries" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid,
        "sessionId" varchar(100),
        "query" text NOT NULL,
        "response" text,
        "category" varchar(50),
        "status" varchar(50) DEFAULT 'completed',
        "embedding" vector(1536),
        "sources" jsonb DEFAULT '[]',
        "tokensUsed" int DEFAULT 0,
        "responseTimeMs" int DEFAULT 0,
        "metadata" jsonb DEFAULT '{}',
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now()
      )
    `);

    // Create indexes for research_queries
    await queryRunner.query(
      `CREATE INDEX "IDX_research_queries_userId" ON "research_queries" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_research_queries_createdAt" ON "research_queries" ("createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_research_queries_category" ON "research_queries" ("category")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_research_queries_status" ON "research_queries" ("status")`,
    );
    // Create vector similarity index for semantic search
    await queryRunner.query(
      `CREATE INDEX "IDX_research_queries_embedding" ON "research_queries" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100)`,
    );

    // Create agent_sessions table
    await queryRunner.query(`
      CREATE TABLE "agent_sessions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "sessionId" varchar(100) UNIQUE NOT NULL,
        "userId" uuid,
        "mode" varchar(50) DEFAULT 'auto',
        "status" varchar(50) DEFAULT 'active',
        "messages" jsonb DEFAULT '[]',
        "context" jsonb DEFAULT '{}',
        "preferences" jsonb DEFAULT '{}',
        "plans" jsonb DEFAULT '[]',
        "executedActions" jsonb DEFAULT '[]',
        "researchQueries" jsonb DEFAULT '[]',
        "totalMessages" int DEFAULT 0,
        "totalTokensUsed" int DEFAULT 0,
        "cycleCount" int DEFAULT 0,
        "lastActivityAt" timestamp,
        "expiresAt" timestamp,
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now(),
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // Create indexes for agent_sessions
    await queryRunner.query(
      `CREATE INDEX "IDX_agent_sessions_sessionId" ON "agent_sessions" ("sessionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_agent_sessions_userId" ON "agent_sessions" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_agent_sessions_createdAt" ON "agent_sessions" ("createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_agent_sessions_status" ON "agent_sessions" ("status")`,
    );

    // Create transactions table
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "hash" varchar(66) UNIQUE NOT NULL,
        "walletId" uuid NOT NULL,
        "type" varchar(50) NOT NULL,
        "from" varchar(42) NOT NULL,
        "to" varchar(42) NOT NULL,
        "value" decimal(36,18) DEFAULT 0,
        "token" varchar(50),
        "status" varchar(50) DEFAULT 'pending',
        "blockNumber" int,
        "confirmedAt" timestamp,
        "gasUsed" decimal(36,18),
        "gasPrice" decimal(36,18),
        "input" text,
        "metadata" jsonb DEFAULT '{}',
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now(),
        FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for transactions
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_hash" ON "transactions" ("hash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_walletId" ON "transactions" ("walletId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_createdAt" ON "transactions" ("createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_status" ON "transactions" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_type" ON "transactions" ("type")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "agent_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "research_queries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wallets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    // Drop pgvector extension
    await queryRunner.query(`DROP EXTENSION IF EXISTS vector`);
  }
}
