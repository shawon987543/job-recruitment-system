import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { Job, JobStatus } from '../jobs/entities/job.entity';
import {
  Application,
  ApplicationStatus,
} from '../applications/entities/application.entity';

import { Role } from '../common/enums/role.enum';
import { CompanyStatus } from '../common/enums/company-status.enum';


interface MonthlyCount {
  month: string;
  count: string;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,

    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>,

    @InjectRepository(Application)
    private readonly applicationsRepository: Repository<Application>,
  ) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalCandidates,
      totalCompanyAdmins,
      totalSuperAdmins,
      activeUsers,
      totalCompanies,
      pendingCompanies,
      approvedCompanies,
      rejectedCompanies,
      activeCompanies,
      totalJobs,
      publishedJobs,
      draftJobs,
      closedJobs,
      totalApplications,
      pendingApplications,
      shortlistedApplications,
      interviewApplications,
      selectedApplications,
      rejectedApplications,
      withdrawnApplications,
    ] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.countBy({ role: Role.CANDIDATE }),
      this.usersRepository.countBy({ role: Role.COMPANY_ADMIN }),
      this.usersRepository.countBy({ role: Role.SUPER_ADMIN }),
      this.usersRepository.countBy({ isActive: true }),

      this.companiesRepository.count(),
      this.companiesRepository.countBy({ status: CompanyStatus.PENDING }),
      this.companiesRepository.countBy({ status: CompanyStatus.APPROVED }),
      this.companiesRepository.countBy({ status: CompanyStatus.REJECTED }),
      this.companiesRepository.countBy({ isActive: true }),

      this.jobsRepository.count(),
      this.jobsRepository.countBy({ status: JobStatus.PUBLISHED }),
      this.jobsRepository.countBy({ status: JobStatus.DRAFT }),
      this.jobsRepository.countBy({ status: JobStatus.CLOSED }),

      this.applicationsRepository.count(),
      this.applicationsRepository.countBy({ status: ApplicationStatus.PENDING }),
      this.applicationsRepository.countBy({ status: ApplicationStatus.SHORTLISTED }),
      this.applicationsRepository.countBy({ status: ApplicationStatus.INTERVIEW }),
      this.applicationsRepository.countBy({ status: ApplicationStatus.SELECTED }),
      this.applicationsRepository.countBy({ status: ApplicationStatus.REJECTED }),
      this.applicationsRepository.countBy({ status: ApplicationStatus.WITHDRAWN }),
    ]);

    return {
      users: {
        total: totalUsers,
        candidates: totalCandidates,
        companyAdmins: totalCompanyAdmins,
        superAdmins: totalSuperAdmins,
        active: activeUsers,
      },
      companies: {
        total: totalCompanies,
        pending: pendingCompanies,
        approved: approvedCompanies,
        rejected: rejectedCompanies,
        active: activeCompanies,
      },
      jobs: {
        total: totalJobs,
        published: publishedJobs,
        draft: draftJobs,
        closed: closedJobs,
      },
      applications: {
        total: totalApplications,
        pending: pendingApplications,
        shortlisted: shortlistedApplications,
        interview: interviewApplications,
        selected: selectedApplications,
        rejected: rejectedApplications,
        withdrawn: withdrawnApplications,
      },
    };
  }

  async getMonthlyAnalytics() {
    const now = new Date();

    const startDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1),
    );

    const endDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const months: string[] = [];

    for (let i = 0; i < 12; i++) {
      const date = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + i, 1),
      );

      const month = `${date.getUTCFullYear()}-${String(
        date.getUTCMonth() + 1,
      ).padStart(2, '0')}`;

      months.push(month);
    }

    const [users, jobs, applications] = await Promise.all([
      this.usersRepository
        .createQueryBuilder('user')
        .select(
          `TO_CHAR(DATE_TRUNC('month', "user"."createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM')`,
          'month',
        )
        .addSelect('COUNT("user"."id")', 'count')
        .where('"user"."createdAt" >= :startDate', { startDate })
        .andWhere('"user"."createdAt" < :endDate', { endDate })
        .groupBy('month')
        .orderBy('month', 'ASC')
        .getRawMany<MonthlyCount>(),

      this.jobsRepository
        .createQueryBuilder('job')
        .select(
          `TO_CHAR(DATE_TRUNC('month', "job"."createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM')`,
          'month',
        )
        .addSelect('COUNT("job"."id")', 'count')
        .where('"job"."createdAt" >= :startDate', { startDate })
        .andWhere('"job"."createdAt" < :endDate', { endDate })
        .groupBy('month')
        .orderBy('month', 'ASC')
        .getRawMany<MonthlyCount>(),

      this.applicationsRepository
        .createQueryBuilder('application')
        .select(
          `TO_CHAR(DATE_TRUNC('month', "application"."appliedAt" AT TIME ZONE 'UTC'), 'YYYY-MM')`,
          'month',
        )
        .addSelect('COUNT("application"."id")', 'count')
        .where('"application"."appliedAt" >= :startDate', { startDate })
        .andWhere('"application"."appliedAt" < :endDate', { endDate })
        .groupBy('month')
        .orderBy('month', 'ASC')
        .getRawMany<MonthlyCount>(),
    ]);

    const toCountMap = (data: MonthlyCount[]) =>
      new Map(data.map((item) => [item.month, Number(item.count)]));

    const userMap = toCountMap(users);
    const jobMap = toCountMap(jobs);
    const applicationMap = toCountMap(applications);

    return {
      period: 'last_12_months',
      users: months.map((month) => ({
        month,
        count: userMap.get(month) ?? 0,
      })),
      jobs: months.map((month) => ({
        month,
        count: jobMap.get(month) ?? 0,
      })),
      applications: months.map((month) => ({
        month,
        count: applicationMap.get(month) ?? 0,
      })),
    };
  }

  async getCompanyPerformance() {
    // Get all companies.
    const companies = await this.companiesRepository.find({
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        isActive: true,
      },
      order: {
        name: 'ASC',
      },
    });

    // Get job counts grouped by company.
    const jobStats = await this.jobsRepository
      .createQueryBuilder('job')
      .select('job."companyId"', 'companyId')
      .addSelect('COUNT(job.id)', 'totalJobs')
      .addSelect(
        `COUNT(job.id) FILTER (WHERE job.status = :published)`,
        'publishedJobs',
      )
      .addSelect(
        `COUNT(job.id) FILTER (WHERE job.status = :draft)`,
        'draftJobs',
      )
      .addSelect(
        `COUNT(job.id) FILTER (WHERE job.status = :closed)`,
        'closedJobs',
      )
      .where('job."companyId" IS NOT NULL')
      .setParameters({
        published: JobStatus.PUBLISHED,
        draft: JobStatus.DRAFT,
        closed: JobStatus.CLOSED,
      })
      .groupBy('job."companyId"')
      .getRawMany();

    // Get application counts grouped by the job's company.
    const applicationStats = await this.applicationsRepository
      .createQueryBuilder('application')
      .innerJoin(
        Job,
        'job',
        'job.id = application."jobId"',
      )
      .select('job."companyId"', 'companyId')
      .addSelect('COUNT(application.id)', 'totalApplications')
      .addSelect(
        `COUNT(application.id) FILTER (WHERE application.status = :pending)`,
        'pending',
      )
      .addSelect(
        `COUNT(application.id) FILTER (WHERE application.status = :shortlisted)`,
        'shortlisted',
      )
      .addSelect(
        `COUNT(application.id) FILTER (WHERE application.status = :interview)`,
        'interview',
      )
      .addSelect(
        `COUNT(application.id) FILTER (WHERE application.status = :selected)`,
        'selected',
      )
      .addSelect(
        `COUNT(application.id) FILTER (WHERE application.status = :rejected)`,
        'rejected',
      )
      .addSelect(
        `COUNT(application.id) FILTER (WHERE application.status = :withdrawn)`,
        'withdrawn',
      )
      .where('job."companyId" IS NOT NULL')
      .setParameters({
        pending: ApplicationStatus.PENDING,
        shortlisted: ApplicationStatus.SHORTLISTED,
        interview: ApplicationStatus.INTERVIEW,
        selected: ApplicationStatus.SELECTED,
        rejected: ApplicationStatus.REJECTED,
        withdrawn: ApplicationStatus.WITHDRAWN,
      })
      .groupBy('job."companyId"')
      .getRawMany();

    // Convert query results into maps for quick lookup.
    const jobMap = new Map(
      jobStats.map((item) => [Number(item.companyId), item]),
    );

    const applicationMap = new Map(
      applicationStats.map((item) => [Number(item.companyId), item]),
    );

    // Return every company, including companies with no jobs or applications.
    return {
      totalCompanies: companies.length,
      companies: companies.map((company) => {
        const jobs = jobMap.get(company.id);
        const applications = applicationMap.get(company.id);

        return {
          id: company.id,
          name: company.name,
          email: company.email,
          status: company.status,
          isActive: company.isActive,

          jobs: {
            total: Number(jobs?.totalJobs ?? 0),
            published: Number(jobs?.publishedJobs ?? 0),
            draft: Number(jobs?.draftJobs ?? 0),
            closed: Number(jobs?.closedJobs ?? 0),
          },

          applications: {
            total: Number(applications?.totalApplications ?? 0),
            pending: Number(applications?.pending ?? 0),
            shortlisted: Number(applications?.shortlisted ?? 0),
            interview: Number(applications?.interview ?? 0),
            selected: Number(applications?.selected ?? 0),
            rejected: Number(applications?.rejected ?? 0),
            withdrawn: Number(applications?.withdrawn ?? 0),
          },
        };
      }),
    };
  }

  async getFilteredReports(filters: {
    period?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const now = new Date();
    let start: Date;
    let end = new Date(now);

    switch (filters.period || 'last30days') {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;

      case 'last7days':
        start = new Date(now);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        break;

      case 'last30days':
        start = new Date(now);
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        break;

      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;

      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        break;

      case 'custom':
        if (!filters.startDate || !filters.endDate) {
          throw new BadRequestException('Custom period requires startDate and endDate');
        }

        start = new Date(`${filters.startDate}T00:00:00`);
        end = new Date(`${filters.endDate}T23:59:59.999`);

        if (
          Number.isNaN(start.getTime()) ||
          Number.isNaN(end.getTime()) ||
          start > end
        ) {
          throw new BadRequestException('Invalid custom date range');
        }
        break;

      default:
        throw new BadRequestException('Invalid report period');
    }

    const [users, jobs, applications] = await Promise.all([
      this.usersRepository.count({
        where: {
          createdAt: Between(start, end),
        },
      }),

      this.jobsRepository.count({
        where: {
          createdAt: Between(start, end),
        },
      }),

      this.applicationsRepository.count({
        where: {
          appliedAt: Between(start, end),
        },
      }),
    ]);

    return {
      period: filters.period || 'last30days',
      dateRange: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      users,
      jobs,
      applications,
    };
  }
}