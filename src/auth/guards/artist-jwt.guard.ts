import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { PayloadType } from '../types';

// Guard spécial Artiste
// Vérifie 2 choses :
// 1️⃣ Token JWT valide
// 2️⃣ User est bien un artiste (artistId présent)
@Injectable()
export class ArtistJwtGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(ArtistJwtGuard.name);

  // Vérifie le token JWT avant tout
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  // Appelé après validation du JWT
  handleRequest<TUser = PayloadType>(
    err: Error | null,
    user: PayloadType | false,
  ): TUser {
    // Si erreur ou pas de user → 401
    if (err ?? !user) {
      throw err ?? new UnauthorizedException('Token invalide');
    }

    // Log pour debug — à désactiver en production
    this.logger.debug(`User connecté: ${user.email}`);

    // ✅ Vérifie que le user a bien un artistId
    if (user.artistId) {
      return user as TUser;
    }

    // Pas d'artistId → pas un artiste → 401
    throw new UnauthorizedException('Accès réservé aux artistes uniquement');
  }
}
