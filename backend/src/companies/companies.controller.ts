import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Search,
  UseGuards,
} from '@nestjs/common';
import { CompanyStatus } from '../common/enums/company-status.enum';
import { RegisterCompanyAdminDto } from './dto/register-company-admin.dto';
import { Put } from '@nestjs/common';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateCompanyStatusDto } from './dto/update-company-status.dto';
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

@Delete(':id/admin/:adminId')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
removeCompanyAdmin(
  @Param('id', ParseIntPipe) id: number,
  @Param('adminId', ParseIntPipe) adminId: number,
) {
  return this.companiesService.removeCompanyAdmin(id, adminId);
}

    // List all companies.
@Get()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
findAll(
  @Query('search') search?: string,
  @Query('status') status?: CompanyStatus,
) {
  void search;
  void status;
  return this.companiesService.findAll();
}

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  findPending() {
    return this.companiesService.findPending();
  }

// View one company and its assigned admins.
@Get(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.companiesService.findOne(id);
}

// Update company details.
@Put(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
update(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateCompanyDto,
) {
  return this.companiesService.update(id, dto);
}

// Activate or deactivate a company.
@Patch(':id/active-status')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
updateActiveStatus(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateCompanyStatusDto,
) {
  return this.companiesService.updateActiveStatus(
    id,
    dto.isActive,
  );
}

    // Super admin manullay create an approved company.
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @HttpCode(HttpStatus.CREATED)
    createManually(@Body() dto: RegisterCompanyDto){
        return this.companiesService.createManually(dto);
    }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterCompanyDto) {
    return this.companiesService.register(dto);
  }

    // Public: submit a Company Admin registration request.
  @Post('register-admin')
  @HttpCode(HttpStatus.CREATED)
  registerCompanyAdmin(
    @Body() dto: RegisterCompanyAdminDto,
  ) {
    return this.companiesService.registerCompanyAdmin(dto);
  }

  
  // List pending additional Company Admin applications.
  @Get('admin-applications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  findAdminApplications() {
    return this.companiesService.findAdminApplications();
  }

  // Approve an additional Company Admin application.
  @Patch('admin-applications/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  approveAdminApplication(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companiesService.approveAdminApplication(
      id,
      user.userId,
    );
  }

  // Reject an additional Company Admin application.
  @Patch('admin-applications/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  rejectAdminApplication(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RejectCompanyDto,
  ) {
    return this.companiesService.rejectAdminApplication(
      id,
      user.userId,
      dto.reason,
    );
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