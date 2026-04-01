import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';
import { PayloadType } from '../types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      // Extrait le token du header Authorization: Bearer eyJ...
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // false → rejette les tokens expirés
      ignoreExpiration: false,

      // ✅ Variable d'environnement
      secretOrKey: process.env.JWT_SECRET ?? 'SECRET_KEY',
    });
  }

  // Appelé automatiquement si le token est valide
  // Ce qu'on retourne → attaché à request.user
  async validate(payload: PayloadType): Promise<PayloadType> {
    // ✅ Vérifie que le user existe toujours en DB
    const user = await this.usersService.findById(payload.userId);

    if (!user) {
      throw new UnauthorizedException('Token invalide');
    }

    return {
      userId: payload.userId,
      email: payload.email,
      artistId: payload.artistId,
    };
  }
}
