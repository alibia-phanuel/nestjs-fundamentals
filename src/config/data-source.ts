import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Song } from '../songs/songs.entity';
import { Artist } from '../artists/artist.entity';
import { User } from '../users/user.entity';
import { Playlist } from '../playlists/playlist.entity';

// Charge les variables .env pour TypeORM CLI
// Ce fichier est utilisé HORS NestJS (migrations uniquement)
config();

const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Song, Artist, User, Playlist],

  // ✅ Jamais true en production !
  synchronize: false,

  // ✅ .ts en dev, .js en production
  migrations: [
    isProduction
      ? __dirname + '/../migrations/*.js' // ← production
      : __dirname + '/../migrations/*.ts', // ← développement
  ],

  // ✅ Logs SQL uniquement en développement
  logging: !isProduction,
});
