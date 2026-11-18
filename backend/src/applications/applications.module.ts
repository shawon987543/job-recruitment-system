import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { Application } from './entities/application.entity';
import { Job } from '../jobs/entities/job.entity';
import { User } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { Interview } from '../interviews/entities/interview.entity';
import { CandidateProfile } from '../candidate-profile/entities/candidate-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Application,
      Job,
      User,
      Company,
      Interview,
      CandidateProfile,
    ]),
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
