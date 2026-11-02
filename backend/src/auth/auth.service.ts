import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Company } from '../companies/entities/company.entity';
import { CompanyStatus } from '../common/enums/company-status.enum';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/entities/user.entity';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Check whether a Company Admin's company is approved and active.
   * Candidates and Super Admins do not need this company check.
   */
  private async ensureCompanyIsActive(user: User): Promise<void> {
    if (user.role !== Role.COMPANY_ADMIN) {
      return;
    }

    if (!user.companyId) {
      throw new UnauthorizedException(
        'Your account is not assigned to a company',
      );
    }

    const company = await this.companiesRepository.findOne({
      where: { id: user.companyId },
    });

    if (
      !company ||
      !company.isActive ||
      company.status !== CompanyStatus.APPROVED
    ) {
      throw new UnauthorizedException(
        'Your company is inactive or not approved',
      );
    }
  }

  /**
   * Refresh access and refresh tokens.
   */
  async refresh(refreshToken: string) {
    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
    );

    if (!refreshSecret || !refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    let payload: { sub: number; email: string };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException(
        'Refresh token is invalid or expired',
      );
    }

    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :id', { id: payload.sub })
      .getOne();

    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new UnauthorizedException(
        'Refresh token is no longer valid',
      );
    }

    // Reject token refresh if the Company Admin's company is inactive.
    await this.ensureCompanyIsActive(user);

    const matches = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );

    if (!matches) {
      throw new UnauthorizedException(
        'Refresh token has already been used or revoked',
      );
    }

    const newPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      mustChangePassword: user.mustChangePassword,
    };

    const accessSecret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
    );

    if (!accessSecret) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }

    const newAccessToken = await this.jwtService.signAsync(
      newPayload,
      {
        secret: accessSecret,
        expiresIn: 900,
      },
    );

    const newRefreshToken = await this.jwtService.signAsync(
      newPayload,
      {
        secret: refreshSecret,
        expiresIn: 604800,
      },
    );

    // Store only the hash of the new refresh token.
    user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 12);
    await this.usersRepository.save(user);

    return {
      message: 'Tokens refreshed successfully',
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      token_type: 'Bearer',
      expires_in: 900,
    };
  }

  /**
   * Logout by revoking the stored refresh token.
   */
  async logout(userId: number) {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (user) {
      user.refreshTokenHash = null;
      await this.usersRepository.save(user);
    }

    return { message: 'Logout successful' };
  }

  /**
   * Change a user's password.
   */
  async ChangePassword(
    userId: number,
    dto: ChangePasswordDto,
  ) {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const passwordMatches = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Current password is incorrect',
      );
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new ConflictException(
        'New password must be different from the current password',
      );
    }

    user.password = await bcrypt.hash(dto.newPassword, 12);
    user.mustChangePassword = false;

    // Require the user to log in again after changing the password.
    user.refreshTokenHash = null;

    await this.usersRepository.save(user);

    return {
      message: 'Password changed successfully. Please log in again.',
    };
  }

  /**
   * Register a new Candidate account.
   */
  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();

    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = this.usersRepository.create({
      name: dto.name.trim(),
      email,
      password: hashedPassword,
      role: Role.CANDIDATE,
    });

    try {
      const savedUser = await this.usersRepository.save(user);

      return {
        message: 'Registration successful',
        user: {
          id: savedUser.id,
          name: savedUser.name,
          email: savedUser.email,
          role: savedUser.role,
        },
      };
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException('Email is already registered');
      }

      throw error;
    }
  }

  /**
   * Authenticate a user and issue access and refresh tokens.
   */
  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();

    // Password is excluded from normal queries, so select it explicitly.
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (
      !user ||
      !(await bcrypt.compare(dto.password, user.password))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account is inactive');
    }

    // Company Admins can log in only if their company is approved and active.
    await this.ensureCompanyIsActive(user);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      mustChangePassword: user.mustChangePassword,
    };

    const accessSecret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
    );

    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
    );

    if (!accessSecret || !refreshSecret) {
      throw new Error(
        'JWT secrets are missing from environment configuration',
      );
    }

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: 900,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: 604800,
    });

    // Store a hash, never the raw refresh token.
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await this.usersRepository.save(user);

    return {
      message: 'Login successful',
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 900,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }
}
