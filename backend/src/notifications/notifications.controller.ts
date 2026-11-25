
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import { NotificationsService } from './notifications.service';

import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { NotificationType } from './entities/notification.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  findMyNotifications(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.findMyNotifications(user.userId);
  }

  @Get('unread-count')
  getUnreadCount(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.getUnreadCount(user.userId);
  }

  @Post('test')
  createTestNotification(
    @CurrentUser() user: AuthenticatedUser,
  ){
    return this.notificationsService.createAndSend({
        userId: user.userId,
        title: 'Test Notification',
        message: 'Your notification system is working!',
        type: NotificationType.NEW_APPLICATION,
        referenceId: null,
        referenceType: null,
    });
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.markAsRead(id, user.userId);
  }

  @Patch('read-all')
  markAllAsRead(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.markAllAsRead(user.userId);
  }
}
