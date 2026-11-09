import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobStatus } from '../jobs/entities/job.entity';
import {
  Application,
  ApplicationStatus,
} from '../applications/entities/application.entity';
import { User } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { Role } from '../common/enums/role.enum';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';

@Injectable()
export class CompanyAdminService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,

    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async getDashboard(companyId: number) {
    if (!companyId) {
      throw new ForbiddenException(
        'You are not assigned to a company',
      );
    }

    // Check that the company admin is still active.
    const companyAdmin = await this.userRepository.findOne({
      where: {
        companyId,
        role: Role.COMPANY_ADMIN,
        isActive: true,
      },
      select: { id: true },
    });

    if (!companyAdmin) {
      throw new ForbiddenException(
        'Active company admin account not found',
      );
    }

    // Job statistics
    const jobs = await this.jobRepository.find({
      where: { companyId },
      select: { id: true, status: true },
    });

    const jobStats = {
      total: jobs.length,
      draft: jobs.filter((job) => job.status === JobStatus.DRAFT).length,
      published: jobs.filter(
        (job) => job.status === JobStatus.PUBLISHED,
      ).length,
      closed: jobs.filter((job) => job.status === JobStatus.CLOSED).length,
    };

    // Get this company's job IDs.
    const jobIds = jobs.map((job) => job.id);

    // Application statistics
    const applications = jobIds.length
      ? await this.applicationRepository.find({
          where: jobIds.map((jobId) => ({ jobId })),
          select: { id: true, status: true },
        })
      : [];

    const applicationStats = {
      total: applications.length,
      pending: applications.filter(
        (app) => app.status === ApplicationStatus.PENDING,
      ).length,
      shortlisted: applications.filter(
        (app) => app.status === ApplicationStatus.SHORTLISTED,
      ).length,
      interview: applications.filter(
        (app) => app.status === ApplicationStatus.INTERVIEW,
      ).length,
      selected: applications.filter(
        (app) => app.status === ApplicationStatus.SELECTED,
      ).length,
      rejected: applications.filter(
        (app) => app.status === ApplicationStatus.REJECTED,
      ).length,
      withdrawn: applications.filter(
        (app) => app.status === ApplicationStatus.WITHDRAWN,
      ).length,
    };

    // Recent applications for this company.
    const recentApplications = jobIds.length
      ? await this.applicationRepository
          .createQueryBuilder('application')
          .innerJoin('jobs', 'job', 'job.id = application.jobId')
          .innerJoin(
            'users',
            'candidate',
            'candidate.id = application.candidateId',
          )
          .where('job.companyId = :companyId', { companyId })
          .select([
            'application.id AS "applicationId"',
            'application.status AS status',
            'application.appliedAt AS "appliedAt"',
            'candidate.name AS "candidateName"',
            'candidate.email AS "candidateEmail"',
            'job.title AS "jobTitle"',
          ])
          .orderBy('application.appliedAt', 'DESC')
          .limit(5)
          .getRawMany()
      : [];

    return {
      jobs: jobStats,
      applications: applicationStats,
      recentApplications,
    };
  }

  async getCompanyProfile(companyId: number) {
  const company = await this.companyRepository.findOne({
    where: { id: companyId },
  });

  if (!company) {
    throw new NotFoundException('Company not found');
  }

  return company;
}

async updateCompanyProfile(
  companyId: number,
  dto: UpdateCompanyProfileDto,
) {
  const company = await this.companyRepository.findOne({
    where: { id: companyId },
  });

  if (!company) {
    throw new NotFoundException('Company not found');
  }

  if (dto.email && dto.email !== company.email) {
    const existingCompany = await this.companyRepository.findOne({
      where: { email: dto.email },
    });

    if (existingCompany) {
      throw new ConflictException(
        'This email is already used by another company',
      );
    }
  }

  Object.assign(company, dto);

  return this.companyRepository.save(company);
}
}
