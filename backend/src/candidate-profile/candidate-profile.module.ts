import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateProfile } from './entities/candidate-profile.entity';
import { Education } from './entities/education.entity';
import { Experience } from './entities/experience.entity';
import { CandidateProfileService } from './candidate-profile.service';
import { CandidateProfileController } from './candidate-profile.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      CandidateProfile,
      Education,
      Experience,
    ]),

    CloudinaryModule,
  ],
  controllers: [CandidateProfileController],
  providers: [CandidateProfileService],
  exports: [CandidateProfileService],
})
export class CandidateProfileModule {}