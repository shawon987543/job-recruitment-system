import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  ParseIntPipe,
  UseGuards,
  Put,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /api/users
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // GET /api/users/company-admin-requests
  @Get('company-admin-requests')
  findCompanyAdminRequests() {
  return this.usersService.findCompanyAdminRequests();
}

// GET /api/users/company-admins
  @Get('company-admins')
  findCompanyAdmins() {
    return this.usersService.findAllCompanyAdmins();
  }

  // GET /api/users/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  // PUT /api/users/:id
    @Put(':id')
    update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
) {
  return this.usersService.update(id, dto);
}

  // PATCH /api/users/:id/active-status
@Patch(':id/active-status')
updateActiveStatus(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateUserStatusDto,
) {
  return this.usersService.updateActiveStatus(
    id,
    dto.isActive,
  );
    }
}
