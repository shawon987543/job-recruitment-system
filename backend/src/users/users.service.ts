import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { Company } from '../companies/entities/company.entity';
import { CompanyStatus } from '../common/enums/company-status.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { CompanyAdminApplication } from './entities/company-admin-application.entity';
import { FindOptionsSelect } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
  @InjectRepository(User)
  private readonly userRepository: Repository<User>,

  @InjectRepository(Company)
  private readonly companyRepository: Repository<Company>,

  @InjectRepository(CompanyAdminApplication)
  private readonly companyAdminApplicationRepository: Repository<CompanyAdminApplication>,
) {}

// Get pending Company Admin registration requests
// Get pending Company Admin registration requests
// Includes both new company registrations and additional admin applications.
async findCompanyAdminRequests() {
  // Get new company registration requests.
  const newCompanyRequests = await this.companyRepository.find({
    where: {
      status: CompanyStatus.PENDING,
      adminEmail: Not(IsNull()),
      adminName: Not(IsNull()),
    },
    select: {
      id: true,
      name: true,
      email: true,
      adminName: true,
      adminEmail: true,
      contactPhone: true,
      website: true,
      address: true,
      description: true,
      status: true,
      createdAt: true,
    },
    order: {
      createdAt: 'DESC',
    },
  });

  // Get pending additional admin applications.
  const additionalApplications =
    await this.companyAdminApplicationRepository.find({
      where: {
        status: 'PENDING',
      },
      order: {
        createdAt: 'DESC',
      },
    });

  // Add company information to each additional admin application.
  const additionalAdminRequests = await Promise.all(
    additionalApplications.map(async (application) => {
      const company = await this.companyRepository.findOne({
        where: {
          id: application.companyId,
        },
      });

      if (!company) {
        return null;
      }

      return {
        id: application.id,
        requestType: 'ADDITIONAL_ADMIN' as const,
        companyId: company.id,
        name: company.name,
        email: company.email,
        adminName: application.adminName,
        adminEmail: application.adminEmail,
        contactPhone: application.contactPhone,
        website: company.website,
        address: company.address,
        description: company.description,
        status: application.status,
        createdAt: application.createdAt,
      };
    }),
  );

  // Identify new company requests.
  const formattedNewCompanyRequests = newCompanyRequests.map(
    (company) => ({
      ...company,
      requestType: 'NEW_COMPANY' as const,
      companyId: company.id,
    }),
  );

  // Remove applications whose company no longer exists.
  const validAdditionalAdminRequests =
    additionalAdminRequests.filter(
      (request) => request !== null,
    );

  // Combine and sort both request types.
  return [
    ...formattedNewCompanyRequests,
    ...validAdditionalAdminRequests,
  ].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime(),
  );
}
  // Get all Company Admins
async findAllCompanyAdmins() {
  const admins = await this.userRepository.find({
    where: {
      role: Role.COMPANY_ADMIN,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
    },
    order: {
      createdAt: 'DESC',
    },
  });

  const companyIds = [
    ...new Set(
      admins
        .map((admin) => admin.companyId)
        .filter((companyId): companyId is number => companyId !== null),
    ),
  ];

  const companies = companyIds.length
    ? await this.companyRepository.find({
        where: { id: In(companyIds) },
        select: { id: true, name: true },
      })
    : [];

  const companyNames = new Map(
    companies.map((company) => [company.id, company.name]),
  );

  return admins.map((admin) => ({
    ...admin,
    companyName: admin.companyId
      ? companyNames.get(admin.companyId) ?? null
      : null,
  }));
}  


  // Update user name and email
  async update(id: number, dto: UpdateUserDto) {
  const user = await this.userRepository.findOneBy({ id });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (dto.email) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.userRepository.findOneBy({
      email,
    });

    if (existingUser && existingUser.id !== id) {
      throw new ConflictException('Email already exists');
    }

    user.email = email;
  }

  if (dto.name !== undefined) {
    user.name = dto.name.trim();
  }

  if (dto.role !== undefined) {
    // Do not allow removing the last Super Admin.
    if (user.role === Role.SUPER_ADMIN && dto.role !== Role.SUPER_ADMIN) {
      const superAdminCount = await this.userRepository.count({
        where: { role: Role.SUPER_ADMIN, isActive: true },
      });

      if (superAdminCount <= 1) {
        throw new BadRequestException(
          'You cannot change the role of the last active Super Admin',
        );
      }
    }

    user.role = dto.role;

    // Candidates and Super Admins should not belong to a company.
    if (dto.role !== Role.COMPANY_ADMIN) {
      user.companyId = null;
    }
  }

  const updatedUser = await this.userRepository.save(user);

  return {
    message: 'User updated successfully',
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      companyId: updatedUser.companyId,
    },
  };
}
  // Get all users
  async findAll() {
    return this.userRepository.find({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // Get one user by ID
  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  // Activate or deactivate a user
  async updateActiveStatus(id: number, isActive: boolean) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (user.role === Role.SUPER_ADMIN) {
      throw new BadRequestException(
        'Super Admin accounts cannot be deactivated through this endpoint',
      );
    }

    user.isActive = isActive;

    await this.userRepository.save(user);

    return {
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: await this.findOne(id),
    };
  }
}
