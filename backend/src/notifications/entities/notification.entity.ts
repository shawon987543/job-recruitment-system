import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationType {
  NEW_APPLICATION = 'NEW_APPLICATION',
  APPLICATION_WITHDRAWN = 'APPLICATION_WITHDRAWN',
  APPLICATION_SHORTLISTED = 'APPLICATION_SHORTLISTED',
  APPLICATION_REJECTED = 'APPLICATION_REJECTED',
  APPLICATION_INTERVIEW = 'APPLICATION_INTERVIEW',
  APPLICATION_SELECTED = 'APPLICATION_SELECTED',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  INTERVIEW_UPDATED = 'INTERVIEW_UPDATED',
  COMPANY_REGISTERED = 'COMPANY_REGISTERED',
  COMPANY_APPROVED = 'COMPANY_APPROVED',
  COMPANY_REJECTED = 'COMPANY_REJECTED',
}

@Entity('notifications')
@Index(['userId', 'isRead', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'user_id',
    type: 'int',
  })
  userId: number;

  @Column({
    type: 'varchar',
    length: 255,
  })
  title: string;

  @Column({
    type: 'text',
  })
  message: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  type: NotificationType;

  @Column({
    name: 'reference_id',
    type: 'int',
    nullable: true,
  })
  referenceId: number | null;

  @Column({
    name: 'reference_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  referenceType: string | null;

  @Column({
    name: 'is_read',
    type: 'boolean',
    default: false,
  })
  isRead: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;
}
