import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('sessions')
export class SessionEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  token!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255, name: 'display_name' })
  displayName!: string;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
