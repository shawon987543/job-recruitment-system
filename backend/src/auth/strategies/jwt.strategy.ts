import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Company } from '../../companies/entities/company.entity';
import { Role } from '../../common/enums/role.enum';
import { CompanyStatus } from '../../common/enums/company-status.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
  ) {
    const secret = configService.get<string>('JWT_ACCESS_SECRET');

    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: {
    sub: number;
    email: string;
    role: string;
    companyId: number | null;
    mustChangePassword?: boolean;
  }) {
    if (!payload.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException('Invalid access token');
    }

    // Check that the user still exists and is active.
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Your account is inactive or no longer exists');
    }

    // Check company status on every authenticated request for Company Admins.
    if (user.role === Role.COMPANY_ADMIN) {
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

    // Use the current database role and company assignment.
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId ?? null,
      mustChangePassword: user.mustChangePassword ?? false,
    };
  }
}
