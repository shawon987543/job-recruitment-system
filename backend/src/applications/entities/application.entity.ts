import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export enum ApplicationStatus {
  PENDING = 'PENDING',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW = 'INTERVIEW',
  SELECTED = 'SELECTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

@Entity('applications')
@Unique('UQ_application_job_candidate', ['jobId', 'candidateId'])
@Index('IDX_applications_job_status', ['jobId', 'status'])
export class Application {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  jobId: number;

  @Column({ type: 'integer' })
  candidateId: number;

  @Column({ type: 'text', nullable: true })
  coverLetter: string | null;

  // This stores a CV URL/path for now.
  // Actual file uploading will be implemented separately.
  @Column({ type: 'varchar', length: 500, nullable: true })
  cvUrl: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: ApplicationStatus.PENDING,
  })
  status: ApplicationStatus;

  @Column({ type: 'text', nullable: true })
  adminNotes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  appliedAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  withdrawnAt: Date | null;
}
