import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PayloadType } from './types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // ✅ Variable d'environnement au lieu de authConstants
      secretOrKey: process.env.JWT_SECRET ?? 'SECRET_KEY',
    });
  }

  // validate() → appelé automatiquement si token valide
  // Ce qu'on retourne ici → attaché à request.user
  validate(payload: PayloadType): PayloadType {
    return {
      userId: payload.userId,
      email: payload.email,
      artistId: payload.artistId, // ✅ artistId inclus
    };
  }
}
