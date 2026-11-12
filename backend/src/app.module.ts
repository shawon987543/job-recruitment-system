// root module -> use all the sub modules.

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesModule } from './companies/companies.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { JobsModule } from './jobs/jobs.module';
import { ApplicationsModule } from './applications/applications.module';
import { AdminModule } from './admin/admin.module';
import { CompanyAdminModule } from './company-admin/company-admin.module';
import { InterviewsModule } from './interviews/interviews.module';
import { CandidateProfileModule } from './candidate-profile/candidate-profile.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    UsersModule,
    AuthModule,
    CompaniesModule,
    JobsModule,
    ApplicationsModule,
    AdminModule,
    CompanyAdminModule,
    InterviewsModule,
    CandidateProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
