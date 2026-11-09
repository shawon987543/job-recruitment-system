import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterCompanyAdminDto {
  // Company information
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  companyName: string;

  @IsEmail()
  @MaxLength(255)
  companyEmail: string;

  // Company Admin account information
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  adminName: string;

  @IsEmail()
  @MaxLength(255)
  adminEmail: string;

  // Additional company information
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