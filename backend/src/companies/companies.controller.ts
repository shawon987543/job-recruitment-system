import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CompaniesService } from './companies.service';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { RejectCompanyDto } from './dto/reject-company.dto';

import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { CreateCompanyAdminDto } from './dto/create-company-admin.dto';
@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
  ) {}

    @Post(':id/admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @HttpCode(HttpStatus.CREATED)
    createCompanyAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCompanyAdminDto,
) {
  return this.companiesService.createCompanyAdmin(id, dto);
}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterCompanyDto) {
    return this.companiesService.register(dto);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  findPending() {
    return this.companiesService.findPending();
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companiesService.approve(id, user.userId);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  reject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RejectCompanyDto,
  ) {
    return this.companiesService.reject(
      id,
      user.userId,
      dto.reason,
    );
  }
}