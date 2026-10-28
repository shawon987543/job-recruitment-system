import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCompanyAdminDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @IsEmail()
  @MaxLength(255)
  email: string;
}