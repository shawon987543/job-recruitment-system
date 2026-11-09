import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  ArrayMaxSize,
  IsPhoneNumber,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  skills?: string[];
}