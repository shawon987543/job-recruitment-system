import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyAdminController } from './company-admin.controller';
import { CompanyAdminService } from './company-admin.service';
import { Job } from '../jobs/entities/job.entity';
import { Application } from '../applications/entities/application.entity';
import { User } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, Application, User, Company]),
  ],
  controllers: [CompanyAdminController],
  providers: [CompanyAdminService],
})
export class CompanyAdminModule {}
