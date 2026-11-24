import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  ArrayMaxSize,
  IsPhoneNumber,
  IsUrl,
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

  @IsOptional()
  @IsUrl()
  @MaxLength(1000)
  resumeUrl?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(1000)
  profilePictureUrl?: string;
}