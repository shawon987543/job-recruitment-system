import {
  Controller,
  Get,
  Body,
  Patch,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { CompanyAdminService } from './company-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('company-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COMPANY_ADMIN)
export class CompanyAdminController {
  constructor(
    private readonly companyAdminService: CompanyAdminService,
  ) {}

    @Get('profile')
  getCompanyProfile(@CurrentUser() user: AuthenticatedUser) {
    if (!user.companyId) {
      throw new ForbiddenException(
        'You are not assigned to a company',
      );
    }

    return this.companyAdminService.getCompanyProfile(user.companyId);
  }

  @Patch('profile')
  updateCompanyProfile(
    @Body() dto: UpdateCompanyProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.companyId) {
      throw new ForbiddenException(
        'You are not assigned to a company',
      );
    }

    return this.companyAdminService.updateCompanyProfile(
      user.companyId,
      dto,
    );
  }


  @Get('dashboard')
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    if (!user.companyId) {
      throw new ForbiddenException(
        'You are not assigned to a company',
      );
    }

    return this.companyAdminService.getDashboard(user.companyId);
  }
}
