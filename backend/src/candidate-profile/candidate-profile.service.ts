import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CandidateProfile } from './entities/candidate-profile.entity';
import { Education } from './entities/education.entity';
import { Experience } from './entities/experience.entity';

import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';

import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class CandidateProfileService {
  constructor(
    @InjectRepository(CandidateProfile)
    private readonly profileRepository: Repository<CandidateProfile>,

    private readonly CloudinaryService: CloudinaryService,

    @InjectRepository(Education)
    private readonly educationRepository: Repository<Education>,

    @InjectRepository(Experience)
    private readonly experienceRepository: Repository<Experience>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // Find candidate profile or create an empty one
  async getOrCreateProfile(userId: number): Promise<CandidateProfile> {
    let profile = await this.profileRepository.findOne({
      where: {
        user: { id: userId },
      },
      relations: {
        user: true,
        educations: true,
        experiences: true,
      },
    });

    if (!profile) {
      profile = this.profileRepository.create({
        user: { id: userId } as any,
        skills: [],
      });

      await this.profileRepository.save(profile);

      profile = await this.profileRepository.findOne({
        where: { id: profile.id },
        relations: {
          user: true,
          educations: true,
          experiences: true,
        },
      });
    }

    return profile!;
  }

  // Get candidate profile
  async getProfile(userId: number): Promise<CandidateProfile> {
    return this.getOrCreateProfile(userId);
  }

  // Update personal details and skills
  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<CandidateProfile> {
    const profile = await this.getOrCreateProfile(userId);

    Object.assign(profile, dto);

    return this.profileRepository.save(profile);
  }

  // Upload resume to Cloudinary
  async uploadResume(
    userId: number,
    file: Express.Multer.File,
  ): Promise<CandidateProfile> {
    if (!file) {
      throw new BadRequestException('Resume file is required');
    }

    const result = await this.cloudinaryService.uploadFile(
      file,
      'candidates/resumes',
    );

    const profile = await this.getOrCreateProfile(userId);

    profile.resumeUrl = result.secure_url;

    return this.profileRepository.save(profile);
  }

  // Update resume URL (existing method)
  async updateResume(
    userId: number,
    resumeUrl: string,
  ): Promise<CandidateProfile> {
    const profile = await this.getOrCreateProfile(userId);

    profile.resumeUrl = resumeUrl;

    return this.profileRepository.save(profile);
  }

  // Upload profile picture to Cloudinary
  async uploadProfilePicture(
    userId: number,
    file: Express.Multer.File,
  ): Promise<{ message: string; profilePictureUrl: string; profile: CandidateProfile }> {
    if (!file) {
      throw new BadRequestException('Profile picture is required');
    }

    const result = await this.cloudinaryService.uploadFile(
      file,
      'candidates/profiles',
    );

    const profile = await this.getOrCreateProfile(userId);

    profile.profilePictureUrl = result.secure_url;

    await this.profileRepository.save(profile);

    return {
      message: 'Profile picture upload successfully',
      profilePictureUrl: result.secure_url,
      profile,
    }
  }

  // Update profile picture URL (existing method)
  async updateProfilePicture(
    userId: number,
    profilePictureUrl: string,
  ): Promise<CandidateProfile> {
    const profile = await this.getOrCreateProfile(userId);

    profile.profilePictureUrl = profilePictureUrl;

    return this.profileRepository.save(profile);
  }

  // Add education
  async addEducation(
    userId: number,
    dto: CreateEducationDto,
  ): Promise<Education> {
    const profile = await this.getOrCreateProfile(userId);

    const education = this.educationRepository.create({
      ...dto,
      candidateProfile: profile,
    });

    return this.educationRepository.save(education);
  }

  // Update education
  async updateEducation(
    userId: number,
    educationId: number,
    dto: UpdateEducationDto,
  ): Promise<Education> {
    const profile = await this.getOrCreateProfile(userId);

    const education = await this.educationRepository.findOne({
      where: {
        id: educationId,
        candidateProfile: { id: profile.id },
      },
    });

    if (!education) {
      throw new NotFoundException('Education record not found');
    }

    Object.assign(education, dto);

    return this.educationRepository.save(education);
  }

  // Delete education
  async deleteEducation(
    userId: number,
    educationId: number,
  ): Promise<{ message: string }> {
    const profile = await this.getOrCreateProfile(userId);

    const education = await this.educationRepository.findOne({
      where: {
        id: educationId,
        candidateProfile: { id: profile.id },
      },
    });

    if (!education) {
      throw new NotFoundException('Education record not found');
    }

    await this.educationRepository.remove(education);

    return { message: 'Education deleted successfully' };
  }

  // Add experience
  async addExperience(
    userId: number,
    dto: CreateExperienceDto,
  ): Promise<Experience> {
    const profile = await this.getOrCreateProfile(userId);

    const experience = this.experienceRepository.create({
      ...dto,
      candidateProfile: profile,
    });

    return this.experienceRepository.save(experience);
  }

  // Update experience
  async updateExperience(
    userId: number,
    experienceId: number,
    dto: UpdateExperienceDto,
  ): Promise<Experience> {
    const profile = await this.getOrCreateProfile(userId);

    const experience = await this.experienceRepository.findOne({
      where: {
        id: experienceId,
        candidateProfile: { id: profile.id },
      },
    });

    if (!experience) {
      throw new NotFoundException('Experience record not found');
    }

    Object.assign(experience, dto);

    return this.experienceRepository.save(experience);
  }

  // Delete experience
  async deleteExperience(
    userId: number,
    experienceId: number,
  ): Promise<{ message: string }> {
    const profile = await this.getOrCreateProfile(userId);

    const experience = await this.experienceRepository.findOne({
      where: {
        id: experienceId,
        candidateProfile: { id: profile.id },
      },
    });

    if (!experience) {
      throw new NotFoundException('Experience record not found');
    }

    await this.experienceRepository.remove(experience);

    return { message: 'Experience deleted successfully' };
  }
}