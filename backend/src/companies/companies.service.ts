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

import { Role } from '../common/enums/role.enum';
import { CompanyStatus } from '../common/enums/company-status.enum';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';

import { Company } from './entities/company.entity';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { CreateCompanyAdminDto } from './dto/create-company-admin.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly mailService: MailService,
  ) {}

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
    const company =
      await this.companiesRepository.findOne({
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

    company.status = CompanyStatus.APPROVED;
    company.rejectionReason = null;
    company.reviewedBy = reviewerId;
    company.reviewedAt = new Date();

    await this.companiesRepository.save(company);

    return {
      message: 'Company approved successfully',
      company,
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
