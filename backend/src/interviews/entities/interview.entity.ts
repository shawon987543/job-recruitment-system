import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum InterviewType {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

export enum InterviewStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('interviews')
@Index('IDX_interviews_company_scheduled', ['companyId', 'scheduledAt'])
@Index('IDX_interviews_application', ['applicationId'])
export class Interview {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  applicationId: number;

  @Column({ type: 'integer' })
  companyId: number;

  @Column({ type: 'timestamptz' })
  scheduledAt: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: InterviewType.ONLINE,
  })
  type: InterviewType;

  @Column({
    type: 'varchar',
    length: 20,
    default: InterviewStatus.SCHEDULED,
  })
  status: InterviewStatus;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  meetingLink: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  location: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'integer' })
  createdBy: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}