import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterCompanyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  contactName: string;

  @IsString()
  @MinLength(7)
  @MaxLength(30)
  contactPhone: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(255)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;
}