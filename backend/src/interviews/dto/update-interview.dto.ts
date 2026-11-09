import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import {
  InterviewStatus,
  InterviewType,
} from '../entities/interview.entity';

export class UpdateInterviewDto {
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsEnum(InterviewType)
  type?: InterviewType;

  @ValidateIf(
    (o) =>
      o.type === InterviewType.ONLINE ||
      (o.type === undefined && o.meetingLink !== undefined),
  )
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @IsUrl({ require_protocol: true })
  meetingLink?: string;

  @ValidateIf(
    (o) =>
      o.type === InterviewType.OFFLINE ||
      (o.type === undefined && o.location !== undefined),
  )
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @IsOptional()
  @IsEnum(InterviewStatus)
  status?: InterviewStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}