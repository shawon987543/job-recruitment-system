import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Interview } from './entities/interview.entity';
import { Application } from '../applications/entities/application.entity';
import { Job } from '../jobs/entities/job.entity';
import { InterviewsService } from './interviews.service';
import { InterviewsController } from './interviews.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Interview, Application, Job]),
  ],
  controllers: [InterviewsController],
  providers: [InterviewsService],
  exports: [InterviewsService],
})
export class InterviewsModule {}