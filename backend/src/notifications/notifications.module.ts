import { Module } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';

import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { Notification } from './entities/notification.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';




@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User, Company]),
    JwtModule.register({}),
  ],
  providers: [
    NotificationsService,
    NotificationsGateway,
],
controllers: [NotificationsController],
exports: [NotificationsService],
})
export class NotificationsModule {}
