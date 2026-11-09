import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Education } from './education.entity';
import { Experience } from './experience.entity';

@Entity('candidate_profiles')
export class CandidateProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({
    type: 'text',
    array: true,
    default: () => "'{}'",
  })
  skills: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  resumeUrl: string | null;

  @OneToMany(() => Education, (education) => education.candidateProfile)
  educations: Education[];

  @OneToMany(() => Experience, (experience) => experience.candidateProfile)
  experiences: Experience[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}