import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class UpdateEducationDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  institution?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  degree?: string;

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