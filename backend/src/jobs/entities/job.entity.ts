import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum JobType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERNSHIP = 'INTERNSHIP',
  REMOTE = 'REMOTE',
}

export enum JobStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
}

@Entity('jobs')
@Index(['companyId', 'status'])
export class Job {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  requirements: string;

  @Column({ type: 'varchar', length: 200 })
  location: string;

  @Column({
    type: 'varchar',
    length: 30,
    default: JobType.FULL_TIME,
  })
  jobType: JobType;

  @Column({ type: 'integer', nullable: true })
  salaryMin: number | null;

  @Column({ type: 'integer', nullable: true })
  salaryMax: number | null;

  @Column({ type: 'date', nullable: true })
  deadline: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: JobStatus.DRAFT,
  })
  status: JobStatus;

  @Column({ type: 'integer' })
  companyId: number;

  @Column({ type: 'integer' })
  createdBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
