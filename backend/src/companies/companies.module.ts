import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { Company } from './entities/company.entity';
import { User } from '../users/entities/user.entity';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Mail } from 'nodemailer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, User]),
    MailModule,
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}