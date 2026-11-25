import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { Role } from '../common/enums/role.enum';
import { CompanyStatus } from '../common/enums/company-status.enum';

interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token;

      if (!token || typeof token !== 'string') {
        client.disconnect(true);
        return;
      }

      const secret = this.configService.get<string>('JWT_ACCESS_SECRET');

      if (!secret) {
        throw new Error('JWT_ACCESS_SECRET is not configured');
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        token,
        { secret },
      );

      if (!payload.sub || !payload.email || !payload.role) {
        client.disconnect(true);
        return;
      }

      // Always use the current database user, not client-supplied identity.
      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive || user.email !== payload.email) {
        client.disconnect(true);
        return;
      }

      // Apply the same company approval checks as HTTP JWT authentication.
      if (user.role === Role.COMPANY_ADMIN) {
        if (!user.companyId) {
          client.disconnect(true);
          return;
        }

        const company = await this.companiesRepository.findOne({
          where: { id: user.companyId },
        });

        if (
          !company ||
          !company.isActive ||
          company.status !== CompanyStatus.APPROVED
        ) {
          client.disconnect(true);
          return;
        }
      }

      // Store verified identity on the socket.
      client.data.user = {
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId ?? null,
      };

      // Each user gets a private room.
      await client.join(`user:${user.id}`);

      console.log(`Notification socket connected: user ${user.id}`);
    } catch (error) {
      console.error('Notification socket authentication failed:', error);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data?.user?.userId;

    if (userId) {
      console.log(`Notification socket disconnected: user ${userId}`);
    }
  }

  // Called by NotificationsService after saving a notification.
  sendToUser(userId: number, notification: unknown): void {
    this.server
      .to(`user:${userId}`)
      .emit('notification:new', notification);
  }
}
