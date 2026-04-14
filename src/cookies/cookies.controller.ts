import { Controller, Get, Post, Res, Req, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response, Request } from 'express';

@ApiTags('Cookies')
@Controller('cookies')
export class CookiesController {
  // ─────────────────────────────────────────
  // POST /cookies/set
  // Crée un cookie dans le navigateur
  // ─────────────────────────────────────────
  @Post('set')
  @ApiOperation({ summary: 'Créer un cookie' })
  setCookie(
    @Body() body: { name: string; value: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    res.cookie(body.name, body.value, {
      // ✅ httpOnly — cookie inaccessible depuis JavaScript
      // Protection contre les attaques XSS
      httpOnly: true,

      // ✅ secure — cookie envoyé uniquement en HTTPS
      // À activer en production
      secure: process.env.NODE_ENV === 'production',

      // ✅ sameSite — protection contre les attaques CSRF
      sameSite: 'strict',

      // ✅ maxAge — expiration en millisecondes
      // 7 jours = 7 * 24 * 60 * 60 * 1000
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: `✅ Cookie "${body.name}" créé avec succès`,
    };
  }

  // ─────────────────────────────────────────
  // GET /cookies/get
  // Lit tous les cookies du navigateur
  // ─────────────────────────────────────────
  @Get('get')
  @ApiOperation({ summary: 'Lire tous les cookies' })
  getCookies(@Req() req: Request) {
    // ✅ req.cookies — objet avec tous les cookies
    // Disponible grâce à cookie-parser
    return {
      cookies: req.cookies,
    };
  }

  // ─────────────────────────────────────────
  // POST /cookies/clear
  // Supprime un cookie
  // ─────────────────────────────────────────
  @Post('clear')
  @ApiOperation({ summary: 'Supprimer un cookie' })
  clearCookie(
    @Body() body: { name: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    // ✅ clearCookie → supprime le cookie du navigateur
    res.clearCookie(body.name);

    return {
      message: `✅ Cookie "${body.name}" supprimé`,
    };
  }
}
