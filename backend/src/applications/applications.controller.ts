import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
  ) {}

  // Super Admin updates any application's status.
@Patch('admin/:id/status')
@Roles(Role.SUPER_ADMIN)
updateStatusForSuperAdmin(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateApplicationStatusDto,
) {
  return this.applicationsService.updateStatusForSuperAdmin(
    id,
    dto,
  );
}
  // Super Admin views all applications.
    @Get('admin/all')
    @Roles(Role.SUPER_ADMIN)
    findAllForSuperAdmin() {
  return this.applicationsService.findAllForSuperAdmin();
}
  // Candidate applies for a job.
  @Post('jobs/:jobId')
  @Roles(Role.CANDIDATE)
  create(
    @Param('jobId', ParseIntPipe) jobId: number,
    @Body() dto: CreateApplicationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.applicationsService.create(
      jobId,
      user.userId,
      dto,
    );
  }

  // Candidate views their own applications.
  @Get('mine')
  @Roles(Role.CANDIDATE)
  findMyApplications(@CurrentUser() user: AuthenticatedUser) {
    return this.applicationsService.findMyApplications(user.userId);
  }

  // Company Admin views applications for their company.
  @Get('company')
    @Roles(Role.COMPANY_ADMIN)
    findCompanyApplications(@CurrentUser() user: AuthenticatedUser) {
    if (user.companyId === null || user.companyId === undefined) {
    throw new ForbiddenException(
      'Your account is not associated with a company.',
    );
  }

  return this.applicationsService.findCompanyApplications(
    user.companyId,
  );
}

  // Company Admin shortlists, rejects, interviews, or selects a candidate.
    @Patch(':id/status')
    @Roles(Role.COMPANY_ADMIN)
    updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApplicationStatusDto,
    @CurrentUser() user: AuthenticatedUser,
) {
  if (user.companyId === null || user.companyId === undefined) {
    throw new ForbiddenException(
      'Your account is not associated with a company.',
    );
  }

  return this.applicationsService.updateStatus(
    id,
    user.companyId,
    dto,
  );
}

  // Candidate withdraws their own pending application.
  @Patch(':id/withdraw')
  @Roles(Role.CANDIDATE)
  withdraw(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.applicationsService.withdraw(id, user.userId);
  }
}
