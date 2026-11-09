import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CandidateProfile } from './candidate-profile.entity';

@Entity('experiences')
export class Experience {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => CandidateProfile,
    (candidateProfile) => candidateProfile.experiences,
    { onDelete: 'CASCADE' },
  )
  candidateProfile: CandidateProfile;

  @Column({ type: 'varchar', length: 150 })
  companyName: string;

  @Column({ type: 'varchar', length: 150 })
  jobTitle: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  employmentType: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  location: string | null;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string | null;

  @Column({ type: 'boolean', default: false })
  isCurrentlyWorking: boolean;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
