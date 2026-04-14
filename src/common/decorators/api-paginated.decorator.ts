import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

// ─────────────────────────────────────────────────────────────
// 💡 CONCEPT — applyDecorators
//
// applyDecorators combine PLUSIEURS décorateurs en UN seul
// Au lieu de répéter @ApiQuery pour page et limit partout
// on crée un seul décorateur @ApiPaginated()
// ─────────────────────────────────────────────────────────────
export const ApiPaginated = () =>
  applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Numéro de page (défaut: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: "Nombre d'éléments par page (défaut: 10, max: 100)",
      example: 10,
    }),
  );

// ✅ Usage :
// @Get()
// @ApiPaginated()  ← remplace deux @ApiQuery séparés
// getAllSongs(@Query('page') page: number) { ... }
