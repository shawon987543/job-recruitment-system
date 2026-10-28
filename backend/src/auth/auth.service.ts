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

import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

 
  async refresh(refreshToken: string) {
    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
    );

    if (!refreshSecret || !refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    let payload: {
      sub: number;
      email: string;
    };

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

    if (
      !user ||
      !user.isActive ||
      !user.refreshTokenHash
    ) {
      throw new UnauthorizedException('Refresh token is no longer valid');
    }

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


  async ChangePassword(
    userId: number,
    dto: ChangePasswordDto,
  ){
    const user = await this.usersRepository
    .createQueryBuilder('user')
    .addSelect('user.password')
    .where('user.id = :id',{id:userId})
    .getOne();

    if(!user || !user.isActive){
        throw new UnauthorizedException('User not found or inactive');
    }

    const passwordMatchs = await bcrypt.compare(
        dto.currentPassword,
        user.password,
    );

    if(!passwordMatchs){
        throw new UnauthorizedException('Current password is incorrect');
    }

    if(dto.currentPassword === dto.newPassword){
        throw new ConflictException(
            'New password must be different from the current password',
        );
    }

    user.password = await bcrypt.hash(dto.newPassword, 12);
    user.mustChangePassword = false;
    user.refreshTokenHash = null;

    await this.usersRepository.save(user);

    return{
        message: 'Password changed successfully. Please log in again.',
    };
  }

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

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();

    // Password is excluded from normal entity queries, so select it explicitly.
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account is inactive');
    }

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
      throw new Error('JWT secrets are missing from environment configuration');
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
