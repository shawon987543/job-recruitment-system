import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Notification,
  NotificationType,
} from './entities/notification.entity';

import { NotificationsGateway } from './notifications.gateway';

interface CreateNotificationInput {
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  referenceId?: number | null;
  referenceType?: string | null;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,

    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async createAndSend(
    input: CreateNotificationInput,
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      ...input,
      referenceId: input.referenceId ?? null,
      referenceType: input.referenceType ?? null,
      isRead: false,
    });

    const savedNotification =
      await this.notificationsRepository.save(notification);

    this.notificationsGateway.sendToUser(
      input.userId,
      savedNotification,
    );

    return savedNotification;
  }

  async findMyNotifications(userId: number): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationsRepository.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markAsRead(
    notificationId: number,
    userId: number,
  ): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;

    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: number): Promise<{ affected: number }> {
    const result = await this.notificationsRepository.update(
      {
        userId,
        isRead: false,
      },
      {
        isRead: true,
      },
    );

    return {
      affected: result.affected ?? 0,
    };
  }
}
