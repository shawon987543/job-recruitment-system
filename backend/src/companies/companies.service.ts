import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompanyAdminApplication } from '../users/entities/company-admin-application.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Role } from '../common/enums/role.enum';
import { CompanyStatus } from '../common/enums/company-status.enum';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';

import { Company } from './entities/company.entity';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { CreateCompanyAdminDto } from './dto/create-company-admin.dto';
import { RegisterCompanyAdminDto } from './dto/register-company-admin.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(CompanyAdminApplication)
    private readonly companyAdminApplicationRepository: Repository<CompanyAdminApplication>,

    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly mailService: MailService,
  ) {}

  // Super Admin: list and search all companies with assigned admins.
  async findAll(
    search?: string,
    status?: CompanyStatus,
  ) {
    const queryBuilder = this.companiesRepository
      .createQueryBuilder('company');

    // Backend search by company name, email, or contact name.
    if (search?.trim()) {
      const searchTerm = `%${search.trim()}%`;

      queryBuilder.andWhere(
        `(
          company.name ILIKE :search OR
          company.email ILIKE :search OR
          company.contactName ILIKE :search
        )`,
        { search: searchTerm },
      );
    }

    // Backend status filtering.
    if (
      status &&
      Object.values(CompanyStatus).includes(status)
    ) {
      queryBuilder.andWhere(
        'company.status = :status',
        { status },
      );
    }

    // Latest companies first.
    queryBuilder.orderBy(
      'company.createdAt',
      'DESC',
    );

    const companies = await queryBuilder.getMany();

    // Get assigned Company Admins.
    const admins = await this.userRepository.find({
      where: { role: Role.COMPANY_ADMIN },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        isActive: true,
      },
    });

    // Preserve the existing API response structure.
    return companies.map((company) => ({
      ...company,
      admins: admins.filter(
        (admin) => admin.companyId === company.id,
      ),
    }));
  }

  // Submit a Company Admin registration request.
  async registerCompanyAdmin(dto: RegisterCompanyAdminDto) {
    const companyEmail = dto.companyEmail.trim().toLowerCase();
    const adminEmail = dto.adminEmail.trim().toLowerCase();

    // Prevent an existing user from applying again.
    const existingAdmin = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      throw new ConflictException(
        'A user with this admin email already exists',
      );
    }

    // Check whether the company already exists.
    const existingCompany = await this.companiesRepository.findOne({
      where: { email: companyEmail },
    });

    // CASE 1: The company already exists.
    if (existingCompany) {
      if (existingCompany.status !== CompanyStatus.APPROVED) {
        throw new ConflictException(
          `This company registration is ${existingCompany.status.toLowerCase()}. Additional admin applications are only allowed for approved companies.`,
        );
      }

      if (!existingCompany.isActive) {
        throw new ConflictException(
          'This company is currently inactive. Additional admin applications are not allowed.',
        );
      }

      // Prevent duplicate pending applications.
      const existingApplication =
        await this.companyAdminApplicationRepository.findOne({
          where: {
            companyId: existingCompany.id,
            adminEmail,
            status: 'PENDING',
          },
        });

      if (existingApplication) {
        throw new ConflictException(
          'An additional admin application with this email is already pending',
        );
      }

      // Prevent the same email from being used in another pending
      // new-company registration.
      const existingCompanyApplicant =
        await this.companiesRepository.findOne({
          where: { adminEmail },
        });

      if (existingCompanyApplicant) {
        throw new ConflictException(
          'A registration request with this admin email already exists',
        );
      }

      const application =
        this.companyAdminApplicationRepository.create({
          companyId: existingCompany.id,
          adminName: dto.adminName.trim(),
          adminEmail,
          contactPhone: dto.contactPhone.trim(),
          status: 'PENDING',
          rejectionReason: null,
          reviewedBy: null,
          reviewedAt: null,
        });

      const savedApplication =
        await this.companyAdminApplicationRepository.save(application);

      return {
        message:
          'Additional Company Admin application submitted successfully. Await Super Admin approval.',
        requestType: 'ADDITIONAL_ADMIN',
        application: {
          id: savedApplication.id,
          companyId: existingCompany.id,
          companyName: existingCompany.name,
          adminName: savedApplication.adminName,
          adminEmail: savedApplication.adminEmail,
          status: savedApplication.status,
        },
      };
    }

    // CASE 2: The company does not exist.
    const existingApplicant = await this.companiesRepository.findOne({
      where: { adminEmail },
    });

    if (existingApplicant) {
      throw new ConflictException(
        'A registration request with this admin email already exists',
      );
    }

    const company = this.companiesRepository.create({
      name: dto.companyName.trim(),
      email: companyEmail,
      adminName: dto.adminName.trim(),
      adminEmail,
      contactName: dto.adminName.trim(),
      contactPhone: dto.contactPhone.trim(),
      website: dto.website?.trim() || null,
      address: dto.address?.trim() || null,
      description: dto.description?.trim() || null,
      status: CompanyStatus.PENDING,
      rejectionReason: null,
      reviewedBy: null,
      reviewedAt: null,
    });

    try {
      const savedCompany = await this.companiesRepository.save(company);

      return {
        message:
          'Company Admin registration request submitted successfully. Await Super Admin approval.',
        requestType: 'NEW_COMPANY',
        company: {
          id: savedCompany.id,
          name: savedCompany.name,
          email: savedCompany.email,
          adminName: savedCompany.adminName,
          adminEmail: savedCompany.adminEmail,
          status: savedCompany.status,
        },
      };
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          'A company or user with the submitted email already exists',
        );
      }

      throw error;
    }
  }

  // Super Admin: view one company and its assigned admins.
  async findOne(companyId: number) {
    const company = await this.companiesRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const admins = await this.userRepository.find({
      where: {
        companyId,
        role: Role.COMPANY_ADMIN,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        isActive: true,
      },
    });

    return {
      ...company,
      admins,
    };
  }

  // Super Admin: update company contact and business details.
  async update(companyId: number, dto: UpdateCompanyDto) {
    const company = await this.companiesRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (dto.email) {
      dto.email = dto.email.trim().toLowerCase();

      const existing = await this.companiesRepository.findOne({
        where: { email: dto.email },
      });

      if (existing && existing.id !== companyId) {
        throw new ConflictException(
          'A company with this email already exists',
        );
      }
    }

    Object.assign(company, {
      ...dto,
      name: dto.name?.trim() ?? company.name,
      contactName: dto.contactName?.trim() ?? company.contactName,
      contactPhone: dto.contactPhone?.trim() ?? company.contactPhone,
      website: dto.website?.trim() || (dto.website === '' ? null : company.website),
      address: dto.address?.trim() || (dto.address === '' ? null : company.address),
      description:
        dto.description?.trim() ||
        (dto.description === '' ? null : company.description),
    });

    try {
      return await this.companiesRepository.save(company);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          'A company with this email already exists',
        );
      }

      throw error;
    }
  }

  // Super Admin: activate or deactivate a company.
  async updateActiveStatus(companyId: number, isActive: boolean) {
    const company = await this.companiesRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    company.isActive = isActive;
    await this.companiesRepository.save(company);

    return {
      message: `Company ${isActive ? 'activated' : 'deactivated'} successfully`,
      company,
    };
  }

  // Super Admin: remove a Company Admin from a company.
  async removeCompanyAdmin(
    companyId: number,
    adminId: number,
  ) {
    const company = await this.companiesRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const admin = await this.userRepository.findOne({
      where: {
        id: adminId,
        companyId: companyId,
        role: Role.COMPANY_ADMIN,
      },
    });

    if (!admin) {
      throw new NotFoundException(
        'Company Admin not found or does not belong to this company',
      );
    }

    // Unassign admin without deleting the account.
    admin.companyId = null;

    await this.userRepository.save(admin);

    return {
      message: 'Company Admin removed from company successfully',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        companyId: admin.companyId,
      },
    };
  }

  // Create a Company Admin for an approved company.
  async createCompanyAdmin(
    companyId: number,
    dto: CreateCompanyAdminDto,
  ) {
    const company = await this.companiesRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.status !== CompanyStatus.APPROVED) {
      throw new BadRequestException(
        'A Company Admin can only be created for an approved company',
      );
    }

    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(
        'A user with this email already exists',
      );
    }

    // Generate a strong temporary password on the server.
    const temporaryPassword =
      `Aa1-${randomBytes(18).toString('hex')}`;

    const passwordHash = await bcrypt.hash(
      temporaryPassword,
      12,
    );

    const admin = this.userRepository.create({
      name: dto.name.trim(),
      email,
      password: passwordHash,
      role: Role.COMPANY_ADMIN,
      companyId: company.id,
      isActive: true,
      mustChangePassword: true,
      refreshTokenHash: null,
    });

    let savedAdmin: User;

    try {
      savedAdmin = await this.userRepository.save(admin);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          'A user with this email already exists',
        );
      }

      throw error;
    }

    // Email delivery is separate from account creation.
    try {
      await this.mailService.sendCompanyAdminCredentials(
        savedAdmin.name,
        savedAdmin.email,
        temporaryPassword,
        company.name,
      );

      return {
        message:
          'Company Admin created and credentials emailed successfully',
        emailSent: true,
        admin: {
          id: savedAdmin.id,
          name: savedAdmin.name,
          email: savedAdmin.email,
          role: savedAdmin.role,
          companyId: savedAdmin.companyId,
          mustChangePassword:
            savedAdmin.mustChangePassword,
        },
      };
    } catch {
      return {
        message:
          'Company Admin created, but email delivery failed',
        emailSent: false,
        admin: {
          id: savedAdmin.id,
          name: savedAdmin.name,
          email: savedAdmin.email,
          role: savedAdmin.role,
          companyId: savedAdmin.companyId,
          mustChangePassword:
            savedAdmin.mustChangePassword,
        },
        temporaryPassword,
        warning:
          'Deliver this password securely and do not log or share it publicly.',
      };
    }
  }

  // Super Admin: manually create an approved company.
  async createManually(dto: RegisterCompanyDto) {
    const email = dto.email.trim().toLowerCase();

    const existingCompany =
      await this.companiesRepository.findOne({
        where: { email },
      });

    if (existingCompany) {
      throw new ConflictException(
        'A Company with this email already exists',
      );
    }

    const company = this.companiesRepository.create({
      name: dto.name.trim(),
      email,
      contactName: dto.contactName.trim(),
      contactPhone: dto.contactPhone.trim(),
      website: dto.website?.trim() || null,
      address: dto.address?.trim() || null,
      description: dto.description?.trim() || null,
      status: CompanyStatus.APPROVED,
      rejectionReason: null,
      reviewedBy: null,
      reviewedAt: new Date(),
    });

    try {
      const saveCompany =
        await this.companiesRepository.save(company);

      return {
        message: 'Company created successfully',
        company: saveCompany,
      };
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          'A company with this email already exists',
        );
      }

      throw error;
    }
  }

  // Submit a new company registration.
  async register(dto: RegisterCompanyDto) {
    const email = dto.email.trim().toLowerCase();

    const existingCompany =
      await this.companiesRepository.findOne({
        where: { email },
      });

    if (existingCompany) {
      throw new ConflictException(
        'A company with this email is already registered',
      );
    }

    const company = this.companiesRepository.create({
      name: dto.name.trim(),
      email,
      contactName: dto.contactName.trim(),
      contactPhone: dto.contactPhone.trim(),
      website: dto.website?.trim() || null,
      address: dto.address?.trim() || null,
      description: dto.description?.trim() || null,
      status: CompanyStatus.PENDING,
      rejectionReason: null,
      reviewedBy: null,
      reviewedAt: null,
    });

    try {
      const savedCompany =
        await this.companiesRepository.save(company);

      return {
        message:
          'Company registration submitted successfully',
        company: savedCompany,
      };
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          'A company with this email is already registered',
        );
      }

      throw error;
    }
  }

  // Get all pending company registrations.
  async findPending() {
    return this.companiesRepository.find({
      where: { status: CompanyStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
  }

  // Approve a pending company registration.
  async approve(
    companyId: number,
    reviewerId: number,
  ) {
    const result = await this.companiesRepository.manager.transaction(
      async (manager) => {
        const companiesRepository = manager.getRepository(Company);
        const usersRepository = manager.getRepository(User);

        const company = await companiesRepository.findOne({
          where: { id: companyId },
        });

        if (!company) {
          throw new NotFoundException('Company not found');
        }

        if (company.status !== CompanyStatus.PENDING) {
          throw new BadRequestException(
            'Only pending company registrations can be approved',
          );
        }

        let admin: User | null = null;

        // New Company Admin registration requests contain both fields.
        if (company.adminName && company.adminEmail) {
          const adminEmail = company.adminEmail.trim().toLowerCase();

          const existingAdmin = await usersRepository.findOne({
            where: { email: adminEmail },
          });

          if (existingAdmin) {
            throw new ConflictException(
              'A user with this admin email already exists',
            );
          }

          const temporaryPassword =
            `Aa1-${randomBytes(18).toString('hex')}`;

          const passwordHash = await bcrypt.hash(
            temporaryPassword,
            12,
          );

          admin = usersRepository.create({
            name: company.adminName.trim(),
            email: adminEmail,
            password: passwordHash,
            role: Role.COMPANY_ADMIN,
            companyId: company.id,
            isActive: true,
            mustChangePassword: true,
            refreshTokenHash: null,
          });

          admin = await usersRepository.save(admin);

          company.status = CompanyStatus.APPROVED;
          company.rejectionReason = null;
          company.reviewedBy = reviewerId;
          company.reviewedAt = new Date();

          await companiesRepository.save(company);

          return {
            company,
            admin,
            temporaryPassword,
          };
        }

        // Older company registrations can still be approved normally.
        if (company.adminName || company.adminEmail) {
          throw new BadRequestException(
            'Company Admin name and email must both be provided',
          );
        }

        company.status = CompanyStatus.APPROVED;
        company.rejectionReason = null;
        company.reviewedBy = reviewerId;
        company.reviewedAt = new Date();

        await companiesRepository.save(company);

        return {
          company,
          admin: null,
          temporaryPassword: null,
        };
      },
    );

    // Send credentials after the database transaction succeeds.
    if (result.admin && result.temporaryPassword) {
      try {
        await this.mailService.sendCompanyAdminCredentials(
          result.admin.name,
          result.admin.email,
          result.temporaryPassword,
          result.company.name,
        );

        return {
          message:
            'Company approved. Company Admin account created and temporary credentials emailed successfully.',
          emailSent: true,
          company: result.company,
          admin: {
            id: result.admin.id,
            name: result.admin.name,
            email: result.admin.email,
            role: result.admin.role,
            companyId: result.admin.companyId,
            mustChangePassword: result.admin.mustChangePassword,
          },
        };
      } catch {
        return {
          message:
            'Company approved and Company Admin account created, but the email could not be delivered. Credentials must be resent through a secure process.',
          emailSent: false,
          company: result.company,
          admin: {
            id: result.admin.id,
            name: result.admin.name,
            email: result.admin.email,
            role: result.admin.role,
            companyId: result.admin.companyId,
            mustChangePassword: result.admin.mustChangePassword,
          },
        };
      }
    }

    return {
      message: 'Company approved successfully',
      emailSent: null,
      company: result.company,
    };
  }

  // Reject a pending company registration.
  async reject(
    companyId: number,
    reviewerId: number,
    reason: string,
  ) {
    const company = await this.companiesRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.status !== CompanyStatus.PENDING) {
      throw new BadRequestException(
        'Only pending company registrations can be rejected',
      );
    }

    company.status = CompanyStatus.REJECTED;
    company.rejectionReason = reason.trim();
    company.reviewedBy = reviewerId;
    company.reviewedAt = new Date();

    await this.companiesRepository.save(company);

    return {
      message: 'Company rejected successfully',
      company,
    };
  }

  // Super Admin: list pending additional admin applications.
  async findAdminApplications() {
    const applications =
      await this.companyAdminApplicationRepository.find({
        where: { status: 'PENDING' },
        order: { createdAt: 'DESC' },
      });

    return Promise.all(
      applications.map(async (application) => {
        const company = await this.companiesRepository.findOne({
          where: { id: application.companyId },
        });

        return {
          ...application,
          company: company
            ? {
                id: company.id,
                name: company.name,
                email: company.email,
                status: company.status,
                isActive: company.isActive,
              }
            : null,
        };
      }),
    );
  }

  // Super Admin: approve an additional Company Admin application.
  async approveAdminApplication(
    applicationId: number,
    reviewerId: number,
  ) {
    const result = await this.companiesRepository.manager.transaction(
      async (manager) => {
        const applicationsRepository =
          manager.getRepository(CompanyAdminApplication);
        const companiesRepository = manager.getRepository(Company);
        const usersRepository = manager.getRepository(User);

        const application = await applicationsRepository.findOne({
          where: { id: applicationId },
        });

        if (!application) {
          throw new NotFoundException(
            'Additional admin application not found',
          );
        }

        if (application.status !== 'PENDING') {
          throw new BadRequestException(
            'Only pending additional admin applications can be approved',
          );
        }

        const company = await companiesRepository.findOne({
          where: { id: application.companyId },
        });

        if (!company) {
          throw new NotFoundException('Company not found');
        }

        if (
          company.status !== CompanyStatus.APPROVED ||
          !company.isActive
        ) {
          throw new BadRequestException(
            'This company is not approved and active',
          );
        }

        const adminEmail = application.adminEmail
          .trim()
          .toLowerCase();

        const existingAdmin = await usersRepository.findOne({
          where: { email: adminEmail },
        });

        if (existingAdmin) {
          throw new ConflictException(
            'A user with this admin email already exists',
          );
        }

        const temporaryPassword =
          `Aa1-${randomBytes(18).toString('hex')}`;

        const passwordHash = await bcrypt.hash(
          temporaryPassword,
          12,
        );

        let admin = usersRepository.create({
          name: application.adminName.trim(),
          email: adminEmail,
          password: passwordHash,
          role: Role.COMPANY_ADMIN,
          companyId: company.id,
          isActive: true,
          mustChangePassword: true,
          refreshTokenHash: null,
        });

        admin = await usersRepository.save(admin);

        application.status = 'APPROVED';
        application.rejectionReason = null;
        application.reviewedBy = reviewerId;
        application.reviewedAt = new Date();

        await applicationsRepository.save(application);

        return {
          company,
          admin,
          temporaryPassword,
        };
      },
    );

    // Send credentials after the transaction succeeds.
    let emailSent = true;

    try {
      await this.mailService.sendCompanyAdminCredentials(
        result.admin.name,
        result.admin.email,
        result.temporaryPassword,
        result.company.name,
      );
    } catch {
      emailSent = false;
    }

    return {
      message: emailSent
        ? 'Additional Company Admin approved and account created successfully. Login credentials have been emailed.'
        : 'Additional Company Admin approved and account created, but the credentials email could not be sent.',
      emailSent,
      applicationId,
      companyId: result.company.id,
      admin: {
        id: result.admin.id,
        name: result.admin.name,
        email: result.admin.email,
        role: result.admin.role,
        companyId: result.admin.companyId,
      },
    };
  }

  // Super Admin: reject an additional Company Admin application.
  async rejectAdminApplication(
    applicationId: number,
    reviewerId: number,
    reason: string,
  ) {
    const application =
      await this.companyAdminApplicationRepository.findOne({
        where: { id: applicationId },
      });

    if (!application) {
      throw new NotFoundException(
        'Additional admin application not found',
      );
    }

    if (application.status !== 'PENDING') {
      throw new BadRequestException(
        'Only pending additional admin applications can be rejected',
      );
    }

    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException(
        'Rejection reason must be at least 5 characters',
      );
    }

    application.status = 'REJECTED';
    application.rejectionReason = reason.trim();
    application.reviewedBy = reviewerId;
    application.reviewedAt = new Date();

    const savedApplication =
      await this.companyAdminApplicationRepository.save(application);

    return {
      message:
        'Additional Company Admin application rejected successfully',
      application: savedApplication,
    };
  }
}
