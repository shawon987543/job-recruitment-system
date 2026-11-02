import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApplicationStatus } from '../entities/application.entity';

export class UpdateApplicationStatusDto {
  @IsEnum([
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.SELECTED,
    ApplicationStatus.REJECTED,
  ])
  status:
    | ApplicationStatus.SHORTLISTED
    | ApplicationStatus.INTERVIEW
    | ApplicationStatus.SELECTED
    | ApplicationStatus.REJECTED;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  adminNotes?: string;
}
