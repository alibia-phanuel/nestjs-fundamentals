import { registerAs } from '@nestjs/config';

// Configuration de l'application
// Accessible via configService.get('app.port')
export default registerAs('app', () => ({
  // Port du serveur — 3000 par défaut
  port: parseInt(process.env.PORT ?? '3000', 10),

  // Environnement — development par défaut
  env: process.env.NODE_ENV ?? 'development',

  // URL du frontend — pour CORS
  frontendUrl: process.env.FRONTEND_URL ?? '*',
}));
