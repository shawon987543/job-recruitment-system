import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class CreateExperienceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  companyName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  jobTitle: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  employmentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @IsDateString()
  startDate: string;

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