import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ArtistJwtGuard } from './guards/artist-jwt.guard';
import { ArtistsModule } from 'src/artists/artists.module';
import { TwoFactorAuthService } from './2fa/two-factor-auth.service';
import { ApiKeyStrategy } from './strategies/api-key.strategy'; // ✅
import { ApiKeyGuard } from './guards/api-key.guard'; // ✅

@Module({
  imports: [
    UsersModule,
    ArtistsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'SECRET_KEY',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    ArtistJwtGuard,
    TwoFactorAuthService,
    ApiKeyStrategy, // ✅ ajouté
    ApiKeyGuard, // ✅ ajouté
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    JwtAuthGuard,
    ArtistJwtGuard,
    TwoFactorAuthService,
    ApiKeyGuard, // ✅ exporté
  ],
})
export class AuthModule {}
