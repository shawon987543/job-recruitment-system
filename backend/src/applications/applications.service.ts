import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import { Application, ApplicationStatus } from './entities/application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { Job, JobStatus } from '../jobs/entities/job.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,

    @InjectRepository(Application)
    private readonly applicationsRepository: Repository<Application>,

    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // Super Admin can update any application's status.
async updateStatusForSuperAdmin(
  applicationId: number,
  dto: UpdateApplicationStatusDto,
) {
  const application = await this.applicationsRepository.findOne({
    where: { id: applicationId },
  });

  if (!application) {
    throw new NotFoundException('Application not found.');
  }

  if (application.status === ApplicationStatus.WITHDRAWN) {
    throw new BadRequestException(
      'A withdrawn application cannot be updated.',
    );
  }

  application.status = dto.status;

  if (dto.adminNotes !== undefined) {
    application.adminNotes = dto.adminNotes;
  }

  return this.applicationsRepository.save(application);
}
  // Super Admin views all applications with candidate, job, and company details.
async findAllForSuperAdmin() {
  const applications = await this.applicationsRepository.find({
    order: {
      appliedAt: 'DESC',
    },
  });

  if (applications.length === 0) {
    return [];
  }

  const jobIds = [
    ...new Set(applications.map((application) => application.jobId)),
  ];

  const candidateIds = [
    ...new Set(applications.map((application) => application.candidateId)),
  ];

  const jobs = await this.jobsRepository.find({
    where: {
      id: In(jobIds),
    },
  });

  const candidates = await this.usersRepository.find({
    where: {
      id: In(candidateIds),
    },
  });

  const companyIds = [
    ...new Set(
      jobs.map((job) => job.companyId).filter(
        (id): id is number => id !== null && id !== undefined,
      ),
    ),
  ];

  const companies =
    companyIds.length > 0
      ? await this.companiesRepository.find({
          where: {
            id: In(companyIds),
          },
        })
      : [];

  const jobMap = new Map(jobs.map((job) => [job.id, job]));
  const candidateMap = new Map(
    candidates.map((candidate) => [candidate.id, candidate]),
  );
  const companyMap = new Map(
    companies.map((company) => [company.id, company]),
  );

  return applications.map((application) => {
    const job = jobMap.get(application.jobId);
    const candidate = candidateMap.get(application.candidateId);
    const company = job ? companyMap.get(job.companyId) : undefined;

    return {
      ...application,

      candidate: candidate
        ? {
            id: candidate.id,
            name: candidate.name,
            email: candidate.email,
            isActive: candidate.isActive,
          }
        : null,

      job: job
        ? {
            id: job.id,
            title: job.title,
            location: job.location,
            jobType: job.jobType,
            status: job.status,
            companyId: job.companyId,
          }
        : null,

      company: company
        ? {
            id: company.id,
            name: company.name,
            email: company.email,
          }
        : null,
    };
  });
}
  // Candidate applies for a published, non-expired job.
  async create(
    jobId: number,
    candidateId: number,
    dto: CreateApplicationDto,
  ) {
    const candidate = await this.usersRepository.findOne({
      where: { id: candidateId },
    });

    if (!candidate || !candidate.isActive) {
      throw new ForbiddenException('Your account is inactive or unavailable.');
    }

    const job = await this.jobsRepository.findOne({
      where: { id: jobId, status: JobStatus.PUBLISHED },
    });

    if (!job) {
      throw new NotFoundException('Published job not found.');
    }

    // Compare YYYY-MM-DD values to avoid time-of-day issues.
    const today = new Date().toISOString().slice(0, 10);

    if (job.deadline && job.deadline < today) {
      throw new BadRequestException('The application deadline has passed.');
    }

    const existing = await this.applicationsRepository.findOne({
      where: { jobId, candidateId },
    });

    if (existing) {
      throw new ConflictException(
        'You have already applied for this job.',
      );
    }

    const application = this.applicationsRepository.create({
      jobId,
      candidateId,
      coverLetter: dto.coverLetter ?? null,
      cvUrl: dto.cvUrl ?? null,
      status: ApplicationStatus.PENDING,
    });

    try {
      return await this.applicationsRepository.save(application);
    } catch (error: unknown) {
      // The database constraint also protects against simultaneous requests.
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          'You have already applied for this job.',
        );
      }

      throw error;
    }
  }

  // Candidate views only their own applications.
  async findMyApplications(candidateId: number) {
    const applications = await this.applicationsRepository.find({
      where: { candidateId },
      order: { appliedAt: 'DESC' },
    });

    return Promise.all(
      applications.map(async (application) => {
        const job = await this.jobsRepository.findOne({
          where: { id: application.jobId },
        });

        return {
          ...application,
          reapplyDisabledReason: this.getReapplyDisabledReason(job),
          job: job
            ? {
                id: job.id,
                title: job.title,
                location: job.location,
                jobType: job.jobType,
                status: job.status,
                deadline: job.deadline,
              }
            : null,
        };
      }),
    );
  }

  private getReapplyDisabledReason(job: Job | null) {
    if (!job) {
      return 'This job is no longer available.';
    }

    if (job.status !== JobStatus.PUBLISHED) {
      return job.status === JobStatus.CLOSED
        ? 'This job is closed and cannot accept reapplications.'
        : 'This job is not currently accepting applications.';
    }

    const today = new Date().toISOString().slice(0, 10);
    if (job.deadline && job.deadline < today) {
      return 'The application deadline has passed.';
    }

    return null;
  }

  // Company Admin sees applications for jobs belonging to their company.
  async findCompanyApplications(companyId: number) {
    const jobs = await this.jobsRepository.find({
      where: { companyId },
    });

    if (jobs.length === 0) {
      return [];
    }

    const applications = await this.applicationsRepository
      .createQueryBuilder('application')
      .where('application.jobId IN (:...jobIds)', {
        jobIds: jobs.map((job) => job.id),
      })
      .orderBy('application.appliedAt', 'DESC')
      .getMany();

    return Promise.all(
      applications.map(async (application) => {
        const [job, candidate] = await Promise.all([
          this.jobsRepository.findOne({
            where: { id: application.jobId },
          }),
          this.usersRepository.findOne({
            where: { id: application.candidateId },
          }),
        ]);

        return {
          ...application,
          job: job
            ? {
                id: job.id,
                title: job.title,
                location: job.location,
              }
            : null,
          candidate: candidate
            ? {
                id: candidate.id,
                name: candidate.name,
                email: candidate.email,
              }
            : null,
        };
      }),
    );
  }

  // Company Admin updates the status of an application for their company.
  async updateStatus(
    applicationId: number,
    companyId: number,
    dto: UpdateApplicationStatusDto,
  ) {
    const application = await this.applicationsRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    const job = await this.jobsRepository.findOne({
      where: { id: application.jobId },
    });

    if (!job || job.companyId !== companyId) {
      throw new ForbiddenException(
        'You cannot manage applications for another company.',
      );
    }

    if (application.status === ApplicationStatus.WITHDRAWN) {
      throw new BadRequestException(
        'A withdrawn application cannot be updated.',
      );
    }

    application.status = dto.status;

    if (dto.adminNotes !== undefined) {
      application.adminNotes = dto.adminNotes;
    }

    return this.applicationsRepository.save(application);
  }

  // Candidate can withdraw only their own pending application.
  async withdraw(applicationId: number, candidateId: number) {
    const application = await this.applicationsRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    if (application.candidateId !== candidateId) {
      throw new ForbiddenException(
        'You cannot withdraw another candidate’s application.',
      );
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException(
        'Only pending applications can be withdrawn.',
      );
    }

    application.status = ApplicationStatus.WITHDRAWN;
    application.withdrawnAt = new Date();

    return this.applicationsRepository.save(application);
  }

  // Reactivate the existing row so prior application data remains attached.
  async reapply(applicationId: number, candidateId: number) {
    const application = await this.applicationsRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    if (application.candidateId !== candidateId) {
      throw new ForbiddenException(
        'You cannot reapply using another candidate’s application.',
      );
    }

    if (application.status !== ApplicationStatus.WITHDRAWN) {
      throw new ConflictException(
        'This application is already active or cannot be reapplied to.',
      );
    }

    const candidate = await this.usersRepository.findOne({
      where: { id: candidateId },
    });
    if (!candidate || !candidate.isActive) {
      throw new ForbiddenException('Your account is inactive or unavailable.');
    }

    const job = await this.jobsRepository.findOne({
      where: { id: application.jobId },
    });

    if (!job) {
      throw new NotFoundException('This job is no longer available.');
    }

    const disabledReason = this.getReapplyDisabledReason(job);
    if (disabledReason) {
      throw new BadRequestException(disabledReason);
    }

    const existingActiveApplication =
      await this.applicationsRepository.findOne({
        where: {
          jobId: application.jobId,
          candidateId,
          status: Not(ApplicationStatus.WITHDRAWN),
        },
      });

    if (existingActiveApplication) {
      throw new ConflictException(
        'You already have an active application for this job.',
      );
    }

    // Update conditionally so concurrent reapply requests cannot both succeed.
    const updateResult = await this.applicationsRepository.update(
      {
        id: applicationId,
        candidateId,
        status: ApplicationStatus.WITHDRAWN,
      },
      { status: ApplicationStatus.PENDING },
    );

    if (updateResult.affected !== 1) {
      throw new ConflictException(
        'This application is already active or has changed. Refresh and try again.',
      );
    }

    return this.applicationsRepository.findOneOrFail({
      where: { id: applicationId, candidateId },
    });
  }
}
