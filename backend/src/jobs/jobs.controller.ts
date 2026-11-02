
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JobsService } from './jobs.service';

import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';

import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

import { Role } from '../common/enums/role.enum';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // ==========================================
  // SUPER ADMIN ROUTES
  // ==========================================

  // Super Admin: View all jobs
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  findAllForSuperAdmin() {
    return this.jobsService.findAllForSuperAdmin();
  }

  // Super Admin: View one job with company details
  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  findOneForSuperAdmin(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobsService.findOneForSuperAdmin(id);
  }

  // Super Admin: Edit any job
  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  updateForSuperAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobsService.updateForSuperAdmin(id, dto);
  }

  // Super Admin: Change any job's status
  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  updateStatusForSuperAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJobStatusDto,
  ) {
    return this.jobsService.updateStatusForSuperAdmin(
      id,
      dto.status,
    );
  }

  // ==========================================
  // COMPANY ADMIN ROUTES
  // ==========================================

  // Company Admin: View their company's jobs
  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN)
  findMyJobs(@CurrentUser() user: AuthenticatedUser) {
    return this.jobsService.findMyJobs(user.companyId);
  }

  // Company Admin: Create a draft job
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN)
  create(
    @Body() dto: CreateJobDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.jobsService.create(
      dto,
      user.userId,
      user.companyId,
    );
  }

  // Company Admin: Update their own company's job
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJobDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.jobsService.update(
      id,
      dto,
      user.companyId,
    );
  }

  // Company Admin: Publish a job
  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN)
  publish(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.jobsService.publish(id, user.companyId);
  }

  // Company Admin: Close a job
  @Patch(':id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN)
  close(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.jobsService.close(id, user.companyId);
  }


  @Get()
  findPublicJobs() {
    return this.jobsService.findPublicJobs();
  }

  // Public: View one published job
  @Get(':id')
  findPublicJobById(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobsService.findPublicJobById(id);
  }
}
