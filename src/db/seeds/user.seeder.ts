// src/db/seeds/user.seeder.ts
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { User } from '../../users/user.entity';
import * as bcrypt from 'bcryptjs';

export class UserSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(User);

    // ✅ Anti-doublon — indispensable en prod
    const existingUser = await repository.findOne({
      where: { email: 'admin@test.com' },
    });

    if (existingUser) {
      console.log('⚠️  Seed déjà exécuté — aucun doublon créé');
      return;
    }

    const hashedPassword = await bcrypt.hash('Admin1234!', 10);

    await repository.save({
      firstName: 'Admin',
      lastName: 'System',
      email: 'admin@test.com',
      password: hashedPassword,
      isActive: true,
    });

    console.log('✅ User admin seedé avec succès');
  }
}
