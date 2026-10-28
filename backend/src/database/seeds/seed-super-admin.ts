import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import AppDataSource from '../data-source';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

async function seedSuperAdmin(): Promise<void> {
  const name = process.env.SUPER_ADMIN_NAME?.trim();
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      'SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env',
    );
  }

  if (password.length < 12 || password.length > 72) {
    throw new Error('Super Admin password must be 12–72 characters long');
  }

  await AppDataSource.initialize();

  try {
    const usersRepository = AppDataSource.getRepository(User);

    const existingUser = await usersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.role !== Role.SUPER_ADMIN) {
        throw new Error(
          `The email ${email} already exists with role ${existingUser.role}. No changes were made.`,
        );
      }

      console.log(`Super Admin already exists: ${email}`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = usersRepository.create({
      name,
      email,
      password: passwordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
      mustChangePassword: true,
      companyId: null,
    });

    await usersRepository.save(admin);

    console.log(`Super Admin created successfully: ${email}`);
    console.log('The account must change its password after login.');
  } finally {
    await AppDataSource.destroy();
  }
}

seedSuperAdmin().catch((error: unknown) => {
  console.error('Super Admin seeding failed:', error);
  process.exitCode = 1;
});
