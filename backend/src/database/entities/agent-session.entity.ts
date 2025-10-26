import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('agent_sessions')
@Index(['sessionId'], { unique: true })
@Index(['userId'])
@Index(['createdAt'])
@Index(['status'])
export class AgentSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  sessionId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ type: 'varchar', length: 50, default: 'auto' })
  mode: string; // 'auto', 'execution', 'planning'

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string; // 'active', 'completed', 'expired'

  // Conversation history
  @Column({ type: 'jsonb', default: [] })
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;

  // Agent context and state
  @Column({ type: 'jsonb', default: {} })
  context: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  preferences: Record<string, any>;

  // Planning and execution tracking
  @Column({ type: 'jsonb', default: [] })
  plans: Array<{
    step: string;
    status: string;
    result?: any;
    timestamp: Date;
  }>;

  @Column({ type: 'jsonb', default: [] })
  executedActions: Array<{
    action: string;
    params: any;
    result: any;
    timestamp: Date;
  }>;

  // Research queries in this session
  @Column({ type: 'jsonb', default: [] })
  researchQueries: string[]; // Array of research query IDs

  // Session metrics
  @Column({ type: 'int', default: 0 })
  totalMessages: number;

  @Column({ type: 'int', default: 0 })
  totalTokensUsed: number;

  @Column({ type: 'int', default: 0 })
  cycleCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.agentSessions, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
