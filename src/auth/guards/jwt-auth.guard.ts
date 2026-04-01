import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Guard JWT — protège les routes privées
// Utilisation : @UseGuards(JwtAuthGuard)
// → Vérifie que le token JWT est valide
// → Si invalide → 401 Unauthorized
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
