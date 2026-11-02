import {
  IsOptional,
  IsString,
  MaxLength,
  IsUrl,
} from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  @MaxLength(10000)
  @IsOptional()
  coverLetter?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  cvUrl?: string;
}
