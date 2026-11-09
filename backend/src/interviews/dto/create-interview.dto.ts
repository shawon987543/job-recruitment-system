import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

import { InterviewType } from '../entities/interview.entity';

export class CreateInterviewDto {
  @IsInt()
  @Min(1)
  applicationId: number;

  @IsDateString()
  scheduledAt: string;

  @IsEnum(InterviewType)
  type: InterviewType;

  @ValidateIf((o) => o.type === InterviewType.ONLINE)
  @IsString()
  @MaxLength(1000)
  @IsUrl({ require_protocol: true })
  meetingLink?: string;

  @ValidateIf((o) => o.type === InterviewType.OFFLINE)
  @IsString()
  @MaxLength(500)
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}