import { registerAs } from '@nestjs/config';

// Interface pour typer la config DB
interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
}

// Configuration de la base de données
// Accessible via configService.get('database.host')
export default registerAs(
  'database',
  (): DatabaseConfig => ({
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '',
    name: process.env.DB_NAME ?? 'spotify-clone',
  }),
);
