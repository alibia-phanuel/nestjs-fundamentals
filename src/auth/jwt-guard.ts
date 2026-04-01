import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Guard JWT — protège les routes privées
// Utilisation : @UseGuards(JwtAuthGuard) sur un controller ou une méthode
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {} // ✅ Guard bien orthographié
