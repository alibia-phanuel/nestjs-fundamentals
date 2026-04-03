import * as Joi from 'joi';

// Validation des variables d'environnement au démarrage
// Si une variable requise manque → l'app refuse de démarrer !
// C'est le "fail-fast" — mieux vaut savoir tôt qu'une config manque
export const envValidationSchema = Joi.object({
  // Environnement
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Serveur
  PORT: Joi.number().default(3000),

  // Frontend — pour CORS
  FRONTEND_URL: Joi.string().default('*'),

  // Base de données — tous requis !
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // Sécurité — requis !
  JWT_SECRET: Joi.string().min(32).required(),
  // ✅ min(32) → force un secret assez long pour la sécurité
});
