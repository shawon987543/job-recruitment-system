import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { CandidateProfileService } from './candidate-profile.service';

import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';

import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UsersController } from '../users/users.controller';

@Controller('candidate-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CANDIDATE)
export class CandidateProfileController {
  constructor(
    private readonly candidateProfileService: CandidateProfileService,
    private readonly CloudinaryService: CloudinaryService,
  ) {}

  // Get candidate profile
  @Get()
  getProfile(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.candidateProfileService.getProfile(user.userId);
  }

  // Update personal details and skills
  @Patch()
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.candidateProfileService.updateProfile(
      user.userId,
      dto,
    );
  }

  // Upload resume to Cloudinary
  @Post('resume')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Only PDF, DOC, and DOCX files are allowed',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  uploadResume(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Resume file is required');
    }

    return this.candidateProfileService.uploadResume(
      user.userId,
      file,
    );
  }

  // Upload resume/upload-signature
  @Post('resume/upload-signature')
  generateResumeUploadSignature() {
  return this.CloudinaryService.generateUploadSignature(
    'candidates/resumes',
    'raw',
  );
}

  // Upload profile picture to Cloudinary
  @Post('profile-picture')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      storage: memoryStorage(),

      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Profile pictures must be JPEG, PNG, WebP, or GIF images',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  uploadProfilePicture(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(
        'A profile picture is required',
      );
    }

    return this.candidateProfileService.uploadProfilePicture(
      user.userId,
      file,
    );
  }

  // profile-picture/upload-signature

  @Post('profile-picture/upload-signature')
  generateProfilePictureUploadSignature() {
  return this.CloudinaryService.generateUploadSignature(
    'candidate/profiles',
    'image',
  );
}

  // Add education
  @Post('education')
  addEducation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEducationDto,
  ) {
    return this.candidateProfileService.addEducation(
      user.userId,
      dto,
    );
  }

  // Update education
  @Patch('education/:id')
  updateEducation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEducationDto,
  ) {
    return this.candidateProfileService.updateEducation(
      user.userId,
      id,
      dto,
    );
  }

  // Delete education
  @Delete('education/:id')
  deleteEducation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.candidateProfileService.deleteEducation(
      user.userId,
      id,
    );
  }

  // Add experience
  @Post('experience')
  addExperience(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExperienceDto,
  ) {
    return this.candidateProfileService.addExperience(
      user.userId,
      dto,
    );
  }

  // Update experience
  @Patch('experience/:id')
  updateExperience(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExperienceDto,
  ) {
    return this.candidateProfileService.updateExperience(
      user.userId,
      id,
      dto,
    );
  }

  // Delete experience
  @Delete('experience/:id')
  deleteExperience(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.candidateProfileService.deleteExperience(
      user.userId,
      id,
    );
  }
}