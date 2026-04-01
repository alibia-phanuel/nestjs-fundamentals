import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDTO } from 'src/users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { TwoFactorAuthService } from './2fa/two-factor-auth.service';
import { JwtAuthGuard } from './jwt-guard';
import { PayloadType } from './types';
import { User } from 'src/users/user.entity';
import { VerifyTwoFactorDto } from './2fa/dto/erify-2fa.dto';

// Type pour typer request.user
interface RequestWithUser extends Request {
  user: PayloadType;
}

type UserWithoutPassword = Omit<User, 'password'>;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UsersService,
    private readonly authService: AuthService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) {}

  // ─────────────────────────────────────────
  // POST /auth/signup
  // ─────────────────────────────────────────
  @Post('signup')
  async signup(@Body() userDTO: CreateUserDTO): Promise<UserWithoutPassword> {
    try {
      return await this.userService.create(userDTO);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la création du compte',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  // ─────────────────────────────────────────
  // POST /auth/login
  // ─────────────────────────────────────────
  @Post('login')
  async login(
    @Body() loginDTO: LoginDto,
  ): Promise<{ accessToken: string } | { message: string }> {
    try {
      return await this.authService.login(loginDTO);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la connexion',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  // ─────────────────────────────────────────
  // POST /auth/2fa/setup
  // Route protégée — user doit être connecté
  // Génère le QR Code pour activer le 2FA
  // ─────────────────────────────────────────
  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  async setupTwoFactor(
    @Request() req: RequestWithUser,
  ): Promise<{ qrCodeUrl: string }> {
    try {
      // Génère le secret et le QR Code
      const { secret, qrCodeUrl } =
        await this.twoFactorAuthService.generateTwoFactorSecret(req.user.email);

      // Sauvegarde le secret en DB et active le 2FA
      await this.userService.enableTwoFactor(req.user.userId, secret);

      // Retourne le QR Code à afficher au user
      // Le user va le scanner avec Google Authenticator
      return { qrCodeUrl };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors du setup 2FA',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  // ─────────────────────────────────────────
  // POST /auth/2fa/verify
  // Vérifie le code 2FA après le login
  // ─────────────────────────────────────────
  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  async verifyTwoFactor(
    @Request() req: RequestWithUser,
    @Body() verifyDto: VerifyTwoFactorDto,
  ): Promise<{ verified: boolean }> {
    try {
      // Récupère le user avec son secret 2FA
      const user = await this.userService.findById(req.user.userId);

      if (!user?.twoFactorSecret) {
        throw new HttpException(
          '2FA non activé pour ce compte',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Vérifie le code entré par le user
      const isValid = this.twoFactorAuthService.verifyTwoFactorCode(
        user.twoFactorSecret,
        verifyDto.code,
      );

      if (!isValid) {
        throw new HttpException(
          'Code 2FA invalide ou expiré',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return { verified: true };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la vérification 2FA',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  // ─────────────────────────────────────────
  // POST /auth/2fa/disable
  // Désactive le 2FA pour un user
  // ─────────────────────────────────────────
  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  async disableTwoFactor(
    @Request() req: RequestWithUser,
  ): Promise<{ message: string }> {
    try {
      await this.userService.disableTwoFactor(req.user.userId);
      return { message: '2FA désactivé avec succès' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la désactivation du 2FA',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  // ─────────────────────────────────────────
  // POST /auth/generate-api-key
  // Génère une API Key pour le user connecté
  // ─────────────────────────────────────────
  @Post('generate-api-key')
  @UseGuards(JwtAuthGuard)
  async generateApiKey(
    @Request() req: RequestWithUser,
  ): Promise<{ apiKey: string }> {
    try {
      return await this.userService.generateApiKey(req.user.userId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        "Erreur lors de la génération de l'API Key",
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  // ─────────────────────────────────────────
  // POST /auth/revoke-api-key
  // Révoque l'API Key du user connecté
  // ─────────────────────────────────────────
  @Post('revoke-api-key')
  @UseGuards(JwtAuthGuard)
  async revokeApiKey(
    @Request() req: RequestWithUser,
  ): Promise<{ message: string }> {
    try {
      return await this.userService.revokeApiKey(req.user.userId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        "Erreur lors de la révocation de l'API Key",
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }
}
