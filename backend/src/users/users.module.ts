import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CompanyAdminApplication } from './entities/company-admin-application.entity';
import { Company } from '../companies/entities/company.entity';
import { CandidateProfile } from '../candidate-profile/entities/candidate-profile.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Company,
      CompanyAdminApplication,
      CandidateProfile,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
