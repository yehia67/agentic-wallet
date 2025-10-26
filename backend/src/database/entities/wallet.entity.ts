import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Transaction } from './transaction.entity';

@Entity('wallets')
@Index(['address'], { unique: true })
@Index(['userId'])
@Index(['createdAt'])
@Index(['isActive'])
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 42, unique: true })
  address: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  label: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ type: 'varchar', length: 50, default: 'base-sepolia' })
  network: string; // 'base-sepolia', 'base-mainnet', etc.

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean; // User's primary wallet

  // Cached balances (updated periodically)
  @Column({ type: 'decimal', precision: 36, scale: 18, default: 0 })
  ethBalance: string;

  @Column({ type: 'decimal', precision: 36, scale: 6, default: 0 })
  usdcBalance: string;

  @Column({ type: 'timestamp', nullable: true })
  lastBalanceUpdate: Date;

  // Encrypted private key (if managed by system)
  @Column({ type: 'text', nullable: true })
  encryptedPrivateKey: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.wallets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Transaction, (transaction) => transaction.wallet)
  transactions: Transaction[];
}
