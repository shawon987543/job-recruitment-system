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

import { InterviewsService } from './interviews.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';

import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('interviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COMPANY_ADMIN)
export class InterviewsController {
  constructor(
    private readonly interviewsService: InterviewsService,
  ) {}

  // Company Admin schedules a new interview.
  @Post()
  create(
    @Body() dto: CreateInterviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (user.companyId === null || user.companyId === undefined) {
      throw new ForbiddenException(
        'Your account is not associated with a company.',
      );
    }

    return this.interviewsService.create(
      user.companyId,
      user.userId,
      dto,
    );
  }

  // Company Admin views all interviews for their company.
  @Get('company')
  findCompanyInterviews(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (user.companyId === null || user.companyId === undefined) {
      throw new ForbiddenException(
        'Your account is not associated with a company.',
      );
    }

    return this.interviewsService.findCompanyInterviews(
      user.companyId,
    );
  }

  // Company Admin views one interview.
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (user.companyId === null || user.companyId === undefined) {
      throw new ForbiddenException(
        'Your account is not associated with a company.',
      );
    }

    return this.interviewsService.findOne(
      user.companyId,
      id,
    );
  }

  // Company Admin updates an interview.
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInterviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (user.companyId === null || user.companyId === undefined) {
      throw new ForbiddenException(
        'Your account is not associated with a company.',
      );
    }

    return this.interviewsService.update(
      user.companyId,
      id,
      dto,
    );
  }
}
