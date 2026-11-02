
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


    async findOneForSuperAdmin(id: number) {
  const job = await this.jobsRepository.findOne({
    where: { id },
  });

  if (!job) {
    throw new NotFoundException('Job not found.');
  }

  const company = await this.companiesRepository.findOne({
    where: { id: job.companyId },
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


  private async getApprovedCompanyIds(): Promise<number[]> {
    const companies = await this.companiesRepository.find({
      select: { id: true },
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

  async findPublicJobs() {
    const companyIds = await this.getApprovedCompanyIds();

    if (companyIds.length === 0) {
      return [];
    }

    return this.jobsRepository
      .createQueryBuilder('job')
      .where('job.status = :status', {
        status: JobStatus.PUBLISHED,
      })
      .andWhere('job.companyId IN (:...companyIds)', {
        companyIds,
      })
      .andWhere(
        '(job.deadline IS NULL OR job.deadline >= CURRENT_DATE)',
      )
      .orderBy('job.createdAt', 'DESC')
      .getMany();
  }

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
      throw new NotFoundException('Job not found or no longer available.');
    }

    const company = await this.companiesRepository.findOne({
      where: {
        id: job.companyId,
        isActive: true,
        status: CompanyStatus.APPROVED,
      },
    });

    if (!company) {
      throw new NotFoundException('Job not found or no longer available.');
    }

    return { ...job, companyName: company.name };
  }

  async findMyJobs(companyId: number | null) {
    await this.ensureCompanyCanManageJobs(companyId);

    return this.jobsRepository.find({
      where: { companyId: companyId! },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllForSuperAdmin() {
    return this.jobsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    dto: CreateJobDto,
    userId: number,
    companyId: number | null,
  ) {
    const company = await this.ensureCompanyCanManageJobs(companyId);

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

  private async findOwnedJob(
    id: number,
    companyId: number | null,
  ): Promise<Job> {
    await this.ensureCompanyCanManageJobs(companyId);

    const job = await this.jobsRepository.findOne({
      where: { id, companyId: companyId! },
    });

    if (!job) {
      throw new NotFoundException(
        'Job not found in your company.',
      );
    }

    return job;
  }

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

  async publish(id: number, companyId: number | null) {
    const job = await this.findOwnedJob(id, companyId);

    if (job.status === JobStatus.CLOSED) {
      throw new BadRequestException(
        'A closed job cannot be published again.',
      );
    }

    job.status = JobStatus.PUBLISHED;

    return this.jobsRepository.save(job);
  }

  async close(id: number, companyId: number | null) {
    const job = await this.findOwnedJob(id, companyId);

    job.status = JobStatus.CLOSED;

    return this.jobsRepository.save(job);
  }
}
