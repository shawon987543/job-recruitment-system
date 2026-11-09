import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateProfile } from './entities/candidate-profile.entity';
import { Education } from './entities/education.entity';
import { Experience } from './entities/experience.entity';
import { CandidateProfileService } from './candidate-profile.service';
import { CandidateProfileController } from './candidate-profile.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CandidateProfile,
      Education,
      Experience,
    ]),
  ],
  controllers: [CandidateProfileController],
  providers: [CandidateProfileService],
  exports: [CandidateProfileService],
})
export class CandidateProfileModule {}