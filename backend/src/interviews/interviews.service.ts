import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Interview,
  InterviewStatus,
  InterviewType,
} from './entities/interview.entity';

import { Application } from '../applications/entities/application.entity';
import { Job } from '../jobs/entities/job.entity';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';

@Injectable()
export class InterviewsService {
  constructor(
    @InjectRepository(Interview)
    private readonly interviewRepository: Repository<Interview>,

    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,

    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  async create(
    companyId: number,
    createdBy: number,
    dto: CreateInterviewDto,
  ) {
    const application = await this.applicationRepository.findOne({
      where: { id: dto.applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const job = await this.jobRepository.findOne({
      where: { id: application.jobId },
    });

    if (!job || job.companyId !== companyId) {
      throw new NotFoundException('Application not found for this company');
    }

    if (application.status === 'REJECTED' || application.status === 'WITHDRAWN') {
      throw new BadRequestException(
        'Cannot schedule an interview for a rejected or withdrawn application',
      );
    }

    if (
      dto.type === InterviewType.ONLINE &&
      !dto.meetingLink
    ) {
      throw new BadRequestException(
        'Meeting link is required for an online interview',
      );
    }

    if (
      dto.type === InterviewType.OFFLINE &&
      !dto.location
    ) {
      throw new BadRequestException(
        'Location is required for an offline interview',
      );
    }

    const interview = this.interviewRepository.create({
      applicationId: dto.applicationId,
      companyId,
      createdBy,
      scheduledAt: new Date(dto.scheduledAt),
      type: dto.type,
      status: InterviewStatus.SCHEDULED,
      meetingLink:
        dto.type === InterviewType.ONLINE ? dto.meetingLink ?? null : null,
      location:
        dto.type === InterviewType.OFFLINE ? dto.location ?? null : null,
      notes: dto.notes ?? null,
    });

    await this.interviewRepository.save(interview);

    if (application.status !== 'INTERVIEW') {
      application.status = 'INTERVIEW' as Application['status'];
      await this.applicationRepository.save(application);
    }

    return this.findOne(companyId, interview.id);
  }

  async findCompanyInterviews(companyId: number) {
    const interviews = await this.interviewRepository.find({
      where: { companyId },
      order: { scheduledAt: 'ASC' },
    });

    return Promise.all(
      interviews.map(async (interview) => {
        const application = await this.applicationRepository.findOne({
          where: { id: interview.applicationId },
        });

        const job = application
          ? await this.jobRepository.findOne({
              where: { id: application.jobId },
            })
          : null;

        return {
          ...interview,
          job: job
            ? {
                id: job.id,
                title: job.title,
                location: job.location,
              }
            : null,
          application: application
            ? {
                id: application.id,
                status: application.status,
                candidateId: application.candidateId,
              }
            : null,
        };
      }),
    );
  }

  async findOne(companyId: number, id: number) {
    const interview = await this.interviewRepository.findOne({
      where: { id, companyId },
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    const application = await this.applicationRepository.findOne({
      where: { id: interview.applicationId },
    });

    const job = application
      ? await this.jobRepository.findOne({
          where: { id: application.jobId },
        })
      : null;

    return {
      ...interview,
      job: job
        ? {
            id: job.id,
            title: job.title,
            location: job.location,
          }
        : null,
      application: application
        ? {
            id: application.id,
            status: application.status,
            candidateId: application.candidateId,
          }
        : null,
    };
  }

  async update(
    companyId: number,
    id: number,
    dto: UpdateInterviewDto,
  ) {
    const interview = await this.interviewRepository.findOne({
      where: { id, companyId },
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    const nextType = dto.type ?? interview.type;

    if (nextType === InterviewType.ONLINE) {
      const meetingLink = dto.meetingLink ?? interview.meetingLink;

      if (!meetingLink) {
        throw new BadRequestException(
          'Meeting link is required for an online interview',
        );
      }

      interview.meetingLink = meetingLink;
      interview.location = null;
    } else {
      const location = dto.location ?? interview.location;

      if (!location) {
        throw new BadRequestException(
          'Location is required for an offline interview',
        );
      }

      interview.location = location;
      interview.meetingLink = null;
    }

    if (dto.scheduledAt) {
      interview.scheduledAt = new Date(dto.scheduledAt);
    }

    if (dto.type) {
      interview.type = dto.type;
    }

    if (dto.status) {
      interview.status = dto.status;
    }

    if (dto.notes !== undefined) {
      interview.notes = dto.notes;
    }

    await this.interviewRepository.save(interview);

    return this.findOne(companyId, id);
  }
}