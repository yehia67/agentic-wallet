import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('research_queries')
@Index(['userId'])
@Index(['createdAt'])
@Index(['category'])
@Index(['status'])
export class ResearchQuery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sessionId: string;

  @Column({ type: 'text' })
  query: string;

  @Column({ type: 'text', nullable: true })
  response: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string; // 'defi', 'nft', 'wallet', 'general'

  @Column({ type: 'varchar', length: 50, default: 'completed' })
  status: string; // 'pending', 'processing', 'completed', 'failed'

  // Vector embedding for semantic search (pgvector)
  @Column({
    type: 'vector',
    length: 1536, // OpenAI embedding dimension
    nullable: true,
  })
  embedding: number[];

  // Research metadata
  @Column({ type: 'jsonb', default: {} })
  sources: Record<string, any>[]; // URLs, citations, etc.

  @Column({ type: 'int', default: 0 })
  tokensUsed: number;

  @Column({ type: 'int', default: 0 })
  responseTimeMs: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
