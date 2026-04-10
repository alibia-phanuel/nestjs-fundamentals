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
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ConfigModule, ConfigService } from '@nestjs/config'; // ✅ ajouté

@Module({
  imports: [
    UsersModule,
    ArtistsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // ✅ registerAsync — attend que ConfigModule charge .env
    // avant d'instancier JwtModule
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') ?? 'SECRET_KEY',
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    ArtistJwtGuard,
    TwoFactorAuthService,
    ApiKeyStrategy,
    ApiKeyGuard,
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    JwtAuthGuard,
    ArtistJwtGuard,
    TwoFactorAuthService,
    ApiKeyGuard,
  ],
})
export class AuthModule {}
