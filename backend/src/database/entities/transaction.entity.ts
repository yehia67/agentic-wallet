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
import { Wallet } from './wallet.entity';

@Entity('transactions')
@Index(['hash'], { unique: true })
@Index(['walletId'])
@Index(['createdAt'])
@Index(['status'])
@Index(['type'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 66, unique: true })
  hash: string;

  @Column({ type: 'uuid' })
  walletId: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // 'transfer', 'mint', 'approve', 'swap', etc.

  @Column({ type: 'varchar', length: 42 })
  from: string;

  @Column({ type: 'varchar', length: 42 })
  to: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, default: 0 })
  value: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  token: string; // 'ETH', 'USDC', etc.

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // 'pending', 'confirmed', 'failed'

  @Column({ type: 'int', nullable: true })
  blockNumber: number;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @Column({ type: 'decimal', precision: 36, scale: 18, nullable: true })
  gasUsed: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, nullable: true })
  gasPrice: string;

  @Column({ type: 'text', nullable: true })
  input: string; // Transaction data

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Wallet, (wallet) => wallet.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;
}
