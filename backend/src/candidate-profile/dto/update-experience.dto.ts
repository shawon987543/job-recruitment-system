import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class UpdateExperienceDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  jobTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  employmentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isCurrentlyWorking?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}