import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly mailService: MailService,
  ) {}

  // Super Admin: list all companies with their assigned admins.
async findAll() {
  const companies = await this.companiesRepository.find({
    order: { createdAt: 'DESC' },
  });

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

  return companies.map((company) => ({
    ...company,
    admins: admins.filter(
      (admin) => admin.companyId === company.id,
    ),
  }));
}

  // Submit a Company Admin registration request for Super Admin approval.
  async registerCompanyAdmin(dto: RegisterCompanyAdminDto) {
    const companyEmail = dto.companyEmail.trim().toLowerCase();
    const adminEmail = dto.adminEmail.trim().toLowerCase();

    const existingCompany = await this.companiesRepository.findOne({
      where: { email: companyEmail },
    });

    if (existingCompany) {
      throw new ConflictException(
        'A company with this email is already registered',
      );
    }

    const existingAdmin = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      throw new ConflictException(
        'A user with this admin email already exists',
      );
    }

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
        message: 'Company Admin registration request submitted successfully. Await Super Admin approval.',
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
  // Check whether company exists.
  const company = await this.companiesRepository.findOne({
    where: { id: companyId },
  });

  if (!company) {
    throw new NotFoundException('Company not found');
  }

  // Find admin assigned to this company.
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

    // Save the account before attempting to send the email.
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

      // Never return the temporary password when email succeeds.
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
      // The account already exists, but the email failed.
      // Deliver this password only through a secure process.
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

  // Manually create an approved company.

  async createManually(dto: RegisterCompanyDto){
    const email = dto.email.trim().toLowerCase();

    const existingCompany = 
    await this.companiesRepository.findOne({
        where: { email },
    });

    if(existingCompany){
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

    try{
        const saveCompany = 
         await this.companiesRepository.save(company);

         return{
            message: 'Company created successfully',
            company: saveCompany,
         };
    } catch (error: unknown){
        if (
            typeof error === 'object' &&
            error !== null && 
            'code' in error && 
            error.code === '23505'
        ){
            throw new ConflictException(
                'A company with this email aready exists',
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

          // Keep the temporary password only in server-side memory
          // until the email delivery attempt.
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
        // Do not expose the temporary password in the API response.
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
    const company =
      await this.companiesRepository.findOne({
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
}
