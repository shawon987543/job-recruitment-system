import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class CreateEducationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  institution: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  degree: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  fieldOfStudy?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isCurrentlyStudying?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}