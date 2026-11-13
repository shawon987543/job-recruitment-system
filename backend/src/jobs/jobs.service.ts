
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Job, JobStatus } from './entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { SearchJobsDto } from './dto/search-jobs.dto';

import { Company } from '../companies/entities/company.entity';
import { CompanyStatus } from '../common/enums/company-status.enum';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>,

    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
  ) {}

  // ==========================================
  // COMPANY APPROVAL CHECK
  // ==========================================

  private async getApprovedCompanyIds(): Promise<number[]> {
    const companies = await this.companiesRepository.find({
      select: {
        id: true,
      },
      where: {
        isActive: true,
        status: CompanyStatus.APPROVED,
      },
    });

    return companies.map((company) => company.id);
  }

  private async ensureCompanyCanManageJobs(
    companyId: number | null,
  ): Promise<Company> {
    if (!companyId) {
      throw new ForbiddenException(
        'Your account is not assigned to a company.',
      );
    }

    const company = await this.companiesRepository.findOne({
      where: {
        id: companyId,
        isActive: true,
        status: CompanyStatus.APPROVED,
      },
    });

    if (!company) {
      throw new ForbiddenException(
        'Your company must be active and approved to manage jobs.',
      );
    }

    return company;
  }

  // ==========================================
  // SUPER ADMIN: VIEW ALL JOBS
  // ==========================================

  async findAllForSuperAdmin() {
    const jobs = await this.jobsRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    if (jobs.length === 0) {
      return [];
    }

    const companies = await this.companiesRepository.find({
      where: {
        id: In([...new Set(jobs.map((job) => job.companyId))]),
      },
      select: {
        id: true,
        name: true,
      },
    });
    const companyNames = new Map(
      companies.map((company) => [company.id, company.name]),
    );

    return jobs.map((job) => ({
      ...job,
      companyName: companyNames.get(job.companyId) ?? 'Company',
    }));
  }

  // ==========================================
  // SUPER ADMIN: VIEW ONE JOB
  // ==========================================

  async findOneForSuperAdmin(id: number) {
    const job = await this.jobsRepository.findOne({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException('Job not found.');
    }

    const company = await this.companiesRepository.findOne({
      where: {
        id: job.companyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        isActive: true,
      },
    });

    return {
      ...job,
      company,
    };
  }

  // ==========================================
  // SUPER ADMIN: UPDATE JOB
  // ==========================================

  async updateForSuperAdmin(
    id: number,
    dto: UpdateJobDto,
  ) {
    const job = await this.jobsRepository.findOne({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException('Job not found.');
    }

    const minSalary = dto.salaryMin ?? job.salaryMin;
    const maxSalary = dto.salaryMax ?? job.salaryMax;

    if (
      minSalary !== null &&
      minSalary !== undefined &&
      maxSalary !== null &&
      maxSalary !== undefined &&
      minSalary > maxSalary
    ) {
      throw new BadRequestException(
        'Minimum salary cannot exceed maximum salary.',
      );
    }

    Object.assign(job, dto);

    return this.jobsRepository.save(job);
  }

  // ==========================================
  // SUPER ADMIN: UPDATE JOB STATUS
  // ==========================================

  async updateStatusForSuperAdmin(
    id: number,
    status: JobStatus,
  ) {
    const job = await this.jobsRepository.findOne({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException('Job not found.');
    }

    job.status = status;

    return this.jobsRepository.save(job);
  }

  // ==========================================
  // PUBLIC: BROWSE AND SEARCH JOBS
  // ==========================================

  async findPublicJobs(filters: SearchJobsDto = {}) {
    const companyIds = await this.getApprovedCompanyIds();

    if (companyIds.length === 0) {
      return [];
    }

    const query = this.jobsRepository
      .createQueryBuilder('job')
      .where('job.status = :status', {
        status: JobStatus.PUBLISHED,
      })
      .andWhere('job.companyId IN (:...companyIds)', {
        companyIds,
      })
      .andWhere(
        '(job.deadline IS NULL OR job.deadline >= CURRENT_DATE)',
      );

    // Search by job title
    if (filters.title?.trim()) {
      query.andWhere('job.title ILIKE :title', {
        title: `%${filters.title.trim()}%`,
      });
    }

    // Filter by job type
    if (filters.jobType) {
      query.andWhere('job.jobType = :jobType', {
        jobType: filters.jobType,
      });
    }

    // Filter by location
    if (filters.location?.trim()) {
      query.andWhere('job.location ILIKE :location', {
        location: `%${filters.location.trim()}%`,
      });
    }

    const jobs = await query
      .orderBy('job.createdAt', 'DESC')
      .getMany();

    if (jobs.length === 0) {
      return [];
    }

    // Get company names for the returned jobs
    const companyIdsForJobs = [
      ...new Set(jobs.map((job) => job.companyId)),
    ];

    const companies = await this.companiesRepository.find({
      where: {
        id: In(companyIdsForJobs),
      },
      select: {
        id: true,
        name: true,
      },
    });

    const companyNames = new Map(
      companies.map((company) => [
        company.id,
        company.name,
      ]),
    );

    return jobs.map((job) => ({
      ...job,
      companyName:
        companyNames.get(job.companyId) ?? 'Company',
    }));
  }

  // ==========================================
  // PUBLIC: VIEW ONE PUBLISHED JOB
  // ==========================================

  async findPublicJobById(id: number) {
    const job = await this.jobsRepository
      .createQueryBuilder('job')
      .where('job.id = :id', { id })
      .andWhere('job.status = :status', {
        status: JobStatus.PUBLISHED,
      })
      .andWhere(
        '(job.deadline IS NULL OR job.deadline >= CURRENT_DATE)',
      )
      .getOne();

    if (!job) {
      throw new NotFoundException(
        'Job not found or no longer available.',
      );
    }

    const company = await this.companiesRepository.findOne({
      where: {
        id: job.companyId,
        isActive: true,
        status: CompanyStatus.APPROVED,
      },
    });

    if (!company) {
      throw new NotFoundException(
        'Job not found or no longer available.',
      );
    }

    return {
      ...job,
      companyName: company.name,
    };
  }

  // ==========================================
  // COMPANY ADMIN: VIEW OWN JOBS
  // ==========================================

  async findMyJobs(companyId: number | null) {
    await this.ensureCompanyCanManageJobs(companyId);

    return this.jobsRepository.find({
      where: {
        companyId: companyId!,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // ==========================================
  // COMPANY ADMIN: CREATE JOB
  // ==========================================

  async create(
    dto: CreateJobDto,
    userId: number,
    companyId: number | null,
  ) {
    const company = await this.ensureCompanyCanManageJobs(
      companyId,
    );

    if (
      dto.salaryMin !== undefined &&
      dto.salaryMax !== undefined &&
      dto.salaryMin > dto.salaryMax
    ) {
      throw new BadRequestException(
        'Minimum salary cannot exceed maximum salary.',
      );
    }

    const job = this.jobsRepository.create({
      ...dto,
      companyId: company.id,
      createdBy: userId,
      status: JobStatus.DRAFT,
    });

    return this.jobsRepository.save(job);
  }

  // ==========================================
  // COMPANY ADMIN: FIND OWN JOB
  // ==========================================

  private async findOwnedJob(
    id: number,
    companyId: number | null,
  ): Promise<Job> {
    await this.ensureCompanyCanManageJobs(companyId);

    const job = await this.jobsRepository.findOne({
      where: {
        id,
        companyId: companyId!,
      },
    });

    if (!job) {
      throw new NotFoundException(
        'Job not found in your company.',
      );
    }

    return job;
  }

  // ==========================================
  // COMPANY ADMIN: UPDATE JOB
  // ==========================================

  async update(
    id: number,
    dto: UpdateJobDto,
    companyId: number | null,
  ) {
    const job = await this.findOwnedJob(id, companyId);

    const minSalary = dto.salaryMin ?? job.salaryMin;
    const maxSalary = dto.salaryMax ?? job.salaryMax;

    if (
      minSalary !== null &&
      minSalary !== undefined &&
      maxSalary !== null &&
      maxSalary !== undefined &&
      minSalary > maxSalary
    ) {
      throw new BadRequestException(
        'Minimum salary cannot exceed maximum salary.',
      );
    }

    Object.assign(job, dto);

    return this.jobsRepository.save(job);
  }

  // ==========================================
  // COMPANY ADMIN: PUBLISH JOB
  // ==========================================

  async publish(
    id: number,
    companyId: number | null,
  ) {
    const job = await this.findOwnedJob(id, companyId);

    if (job.status === JobStatus.CLOSED) {
      throw new BadRequestException(
        'A closed job cannot be published again.',
      );
    }

    job.status = JobStatus.PUBLISHED;

    return this.jobsRepository.save(job);
  }

  // ==========================================
  // COMPANY ADMIN: CLOSE JOB
  // ==========================================

  async close(
    id: number,
    companyId: number | null,
  ) {
    const job = await this.findOwnedJob(id, companyId);

    job.status = JobStatus.CLOSED;

    return this.jobsRepository.save(job);
  }
}
