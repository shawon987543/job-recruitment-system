import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CandidateProfile } from './candidate-profile.entity';

@Entity('educations')
export class Education {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => CandidateProfile,
    (candidateProfile) => candidateProfile.educations,
    { onDelete: 'CASCADE' },
  )
  candidateProfile: CandidateProfile;

  @Column({ type: 'varchar', length: 150 })
  institution: string;

  @Column({ type: 'varchar', length: 150 })
  degree: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  fieldOfStudy: string | null;

  @Column({ type: 'date', nullable: true })
  startDate: string | null;

  @Column({ type: 'date', nullable: true })
  endDate: string | null;

  @Column({ type: 'boolean', default: false })
  isCurrentlyStudying: boolean;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}