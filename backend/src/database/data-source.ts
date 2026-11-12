import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { Job } from '../jobs/entities/job.entity';
import { Application } from '../applications/entities/application.entity';
import { Interview } from '../interviews/entities/interview.entity';
import { CandidateProfile } from '../candidate-profile/entities/candidate-profile.entity';
import { Education } from '../candidate-profile/entities/education.entity';
import { Experience } from '../candidate-profile/entities/experience.entity';
import { CompanyAdminApplication } from '../users/entities/company-admin-application.entity';
const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
  User,
  Company,
  Job,
  Application,
  Interview,
  CandidateProfile,
  Education,
  Experience,
  CompanyAdminApplication,
],
  migrations: [__dirname + '/migrations/*.ts'],
  synchronize: false,
});

export default AppDataSource;
