// src/db/seeds/run-seeds.ts
import { AppDataSource } from '../../config/data-source';
import { MainSeeder } from './main.seeder';

async function runSeeds() {
  // ✅ Initialise la connexion
  await AppDataSource.initialize();
  console.log('✅ Connexion DB établie');

  try {
    const seeder = new MainSeeder();
    await seeder.run(AppDataSource);
    console.log('✅ Seeding terminé avec succès');
  } catch (error) {
    console.error('❌ Erreur pendant le seeding :', error);
    process.exit(1);
  } finally {
    // ✅ Toujours fermer la connexion
    await AppDataSource.destroy();
    console.log('✅ Connexion fermée');
  }
}

runSeeds();
