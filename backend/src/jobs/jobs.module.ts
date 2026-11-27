import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { Company } from '../companies/entities/company.entity';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { User } from '../users/entities/user.entity'
import { NotificationsModule } from '../notifications/notifications.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Job, Company, User]),
    NotificationsModule,
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
